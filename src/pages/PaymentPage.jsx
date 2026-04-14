import { useState } from 'react';
import { CreditCard, Zap, FileText, HardDrive, TrendingUp, CheckCircle, AlertCircle, IndianRupee } from 'lucide-react';
import { estimateSpend, createRazorpayOrder } from '../api';
import { useAuth } from '../AuthContext';
import toast from 'react-hot-toast';

// Default estimate values for a typical grading session
const DEFAULTS = {
  geminiInputTokens: 50000,
  geminiOutputTokens: 10000,
  ocrPages: 30,
  gcsStorageGb: 0.1,
  gcsEgressGb: 0.1,
};

function loadRazorpay() {
  return new Promise((resolve) => {
    if (window.Razorpay) { resolve(true); return; }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export default function PaymentPage() {
  const { user } = useAuth();
  const [inputs, setInputs] = useState(DEFAULTS);
  const [breakdown, setBreakdown] = useState(null);
  const [estimating, setEstimating] = useState(false);
  const [paying, setPaying] = useState(false);
  const [paid, setPaid] = useState(false);

  const set = (k, v) => setInputs(i => ({ ...i, [k]: Number(v) || 0 }));

  const handleEstimate = async () => {
    setEstimating(true);
    try {
      const res = await estimateSpend(inputs);
      setBreakdown(res.breakdown);
    } catch (e) {
      toast.error(e.message);
    } finally {
      setEstimating(false);
    }
  };

  const handlePay = async () => {
    if (!breakdown) return toast.error('Calculate estimate first');
    setPaying(true);

    try {
      const loaded = await loadRazorpay();
      if (!loaded) { toast.error('Could not load Razorpay. Check your connection.'); setPaying(false); return; }

      const idempotencyKey = `pay-${user?.id}-${Date.now()}`;
      const orderRes = await createRazorpayOrder(inputs, idempotencyKey);

      const options = {
        key: orderRes.keyId,
        amount: orderRes.order.amountPaise,
        currency: orderRes.order.currency,
        name: 'AutoGrade.ai',
        description: 'AI Grading Credits',
        order_id: orderRes.order.orderId,
        prefill: {
          name: user?.fullName || '',
          email: user?.email || '',
        },
        theme: { color: '#059669' },
        handler: () => {
          setPaid(true);
          toast.success('Payment successful! Credits added to your account.');
        },
        modal: {
          ondismiss: () => {
            setPaying(false);
          },
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', () => {
        toast.error('Payment failed. Please try again.');
        setPaying(false);
      });
      rzp.open();
    } catch (e) {
      toast.error(e.message);
      setPaying(false);
    }
  };

  if (paid) {
    return (
      <div className="page-wrap" style={{maxWidth:560}}>
        <div className="glass-card fade-up" style={{padding:48,display:'flex',flexDirection:'column',alignItems:'center',textAlign:'center'}}>
          <div style={{width:80,height:80,borderRadius:20,background:'rgba(16,185,129,0.1)',border:'1px solid rgba(16,185,129,0.2)',display:'flex',alignItems:'center',justifyContent:'center',marginBottom:24}}>
            <CheckCircle size={40} color="#34d399"/>
          </div>
          <h2 style={{fontSize:24,fontWeight:600,marginBottom:10}}>Payment Successful!</h2>
          <p style={{color:'#64748b',fontSize:14,lineHeight:1.7,marginBottom:28}}>
            Your credits have been added. You can now continue grading submissions.
          </p>
          <button className="btn btn-emerald btn-lg" onClick={() => { setPaid(false); setBreakdown(null); }}>
            Buy More Credits
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="page-wrap" style={{maxWidth:860}}>
      <div className="fade-up" style={{marginBottom:32}}>
        <p className="page-eyebrow">Billing</p>
        <h1 className="page-title">Buy Grading Credits</h1>
        <p className="page-sub">Estimate your cost and pay securely via Razorpay. Free tier includes 5 submissions.</p>
      </div>

      {/* Free tier notice */}
      <div className="fade-up" style={{marginBottom:28,padding:'16px 20px',borderRadius:14,background:'rgba(139,92,246,0.07)',border:'1px solid rgba(139,92,246,0.2)',display:'flex',gap:12,animationDelay:'0.05s'}}>
        <AlertCircle size={18} color="#a78bfa" style={{flexShrink:0,marginTop:2}}/>
        <div style={{fontSize:13,color:'#94a3b8',lineHeight:1.7}}>
          <strong style={{color:'#f1f5f9'}}>Free tier:</strong> Each account gets <strong style={{color:'#a78bfa'}}>5 free submissions</strong>. After that, purchase credits to continue grading. Pricing is based on actual usage — Gemini tokens, OCR pages, and storage.
        </div>
      </div>

      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:24}}>
        {/* Left — Estimate inputs */}
        <div className="fade-up" style={{animationDelay:'0.1s'}}>
          <div className="glass-card" style={{padding:28}}>
            <h2 style={{fontSize:16,fontWeight:600,marginBottom:20,display:'flex',alignItems:'center',gap:8}}>
              <TrendingUp size={16} color="#34d399"/> Estimate Usage
            </h2>

            <div style={{display:'flex',flexDirection:'column',gap:18}}>
              <EstimateField icon={<Zap size={14} color="#34d399"/>} label="Gemini Input Tokens" sublabel="~1000 tokens per student answer" value={inputs.geminiInputTokens} onChange={v=>set('geminiInputTokens',v)}/>
              <EstimateField icon={<Zap size={14} color="#2dd4bf"/>} label="Gemini Output Tokens" sublabel="~200 tokens per feedback response" value={inputs.geminiOutputTokens} onChange={v=>set('geminiOutputTokens',v)}/>
              <EstimateField icon={<FileText size={14} color="#a78bfa"/>} label="OCR Pages" sublabel="Pages scanned from student submissions" value={inputs.ocrPages} onChange={v=>set('ocrPages',v)}/>
              <EstimateField icon={<HardDrive size={14} color="#60a5fa"/>} label="GCS Storage (GB)" sublabel="Uploaded files stored temporarily" value={inputs.gcsStorageGb} onChange={v=>set('gcsStorageGb',v)} step={0.01}/>
              <EstimateField icon={<HardDrive size={14} color="#facc15"/>} label="GCS Egress (GB)" sublabel="Data transferred during processing" value={inputs.gcsEgressGb} onChange={v=>set('gcsEgressGb',v)} step={0.01}/>
            </div>

            <button
              className="btn btn-emerald"
              style={{width:'100%',justifyContent:'center',marginTop:24,height:44}}
              onClick={handleEstimate}
              disabled={estimating}
            >
              {estimating ? <><span className="spinner"/> Calculating…</> : 'Calculate Estimate'}
            </button>
          </div>
        </div>

        {/* Right — Breakdown + Pay */}
        <div className="fade-up" style={{animationDelay:'0.15s'}}>
          {!breakdown ? (
            <div className="glass-card" style={{padding:28,height:'100%',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:12,color:'#334155',textAlign:'center'}}>
              <IndianRupee size={36} color="#1e293b"/>
              <p style={{fontSize:13}}>Fill in your usage estimates and click <strong style={{color:'#64748b'}}>Calculate Estimate</strong> to see the cost breakdown.</p>
            </div>
          ) : (
            <div className="glass-card" style={{padding:28}}>
              <h2 style={{fontSize:16,fontWeight:600,marginBottom:20,display:'flex',alignItems:'center',gap:8}}>
                <IndianRupee size={16} color="#34d399"/> Cost Breakdown
              </h2>

              <div style={{display:'flex',flexDirection:'column',gap:10,marginBottom:20}}>
                {[
                  {label:'Gemini Input',   val:breakdown.geminiInputCostInr,   color:'#34d399'},
                  {label:'Gemini Output',  val:breakdown.geminiOutputCostInr,  color:'#2dd4bf'},
                  {label:'OCR Processing', val:breakdown.ocrCostInr,           color:'#a78bfa'},
                  {label:'GCS Storage',    val:breakdown.gcsStorageCostInr,    color:'#60a5fa'},
                  {label:'GCS Egress',     val:breakdown.gcsEgressCostInr,     color:'#facc15'},
                  {label:'Infrastructure', val:breakdown.infraCostInr,         color:'#94a3b8'},
                ].map(r => (
                  <div key={r.label} style={{display:'flex',justifyContent:'space-between',alignItems:'center',fontSize:13}}>
                    <div style={{display:'flex',alignItems:'center',gap:8}}>
                      <div style={{width:6,height:6,borderRadius:'50%',background:r.color,flexShrink:0}}/>
                      <span style={{color:'#94a3b8'}}>{r.label}</span>
                    </div>
                    <span style={{fontFamily:'monospace',fontSize:12}}>₹{r.val.toFixed(2)}</span>
                  </div>
                ))}

                <div style={{height:1,background:'rgba(255,255,255,0.08)',margin:'8px 0'}}/>

                <div style={{display:'flex',justifyContent:'space-between',fontSize:13}}>
                  <span style={{color:'#94a3b8'}}>Base Cost</span>
                  <span style={{fontFamily:'monospace',fontSize:12}}>₹{breakdown.baseCostInr.toFixed(2)}</span>
                </div>
                <div style={{display:'flex',justifyContent:'space-between',fontSize:13}}>
                  <span style={{color:'#94a3b8'}}>Platform Fee ({breakdown.rates.profitMarginPercent}%)</span>
                  <span style={{fontFamily:'monospace',fontSize:12}}>₹{breakdown.profitInr.toFixed(2)}</span>
                </div>

                <div style={{height:1,background:'rgba(255,255,255,0.08)',margin:'8px 0'}}/>

                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                  <span style={{fontSize:15,fontWeight:600}}>Total (INR)</span>
                  <span style={{fontSize:22,fontWeight:700,color:'#34d399',fontFamily:'monospace'}}>₹{breakdown.finalChargeInr.toFixed(2)}</span>
                </div>
              </div>

              <button
                className="btn btn-sync"
                style={{width:'100%',justifyContent:'center',height:48,fontSize:15}}
                onClick={handlePay}
                disabled={paying}
              >
                {paying ? <><span className="spinner" style={{width:16,height:16}}/> Opening Payment…</> : <><CreditCard size={16}/> Pay ₹{breakdown.finalChargeInr.toFixed(2)} via Razorpay</>}
              </button>

              <p style={{fontSize:11,color:'#334155',textAlign:'center',marginTop:12,lineHeight:1.6}}>
                Secure payment powered by Razorpay. Your card details are never stored on our servers.
              </p>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @media(max-width:768px) { div[style*="gridTemplateColumns: 1fr 1fr"] { grid-template-columns:1fr !important; } }
      `}</style>
    </div>
  );
}

function EstimateField({ icon, label, sublabel, value, onChange, step = 1 }) {
  return (
    <div>
      <div style={{display:'flex',alignItems:'center',gap:7,marginBottom:5}}>
        {icon}
        <label style={{fontSize:12,fontWeight:600,color:'#94a3b8',textTransform:'uppercase',letterSpacing:'0.06em'}}>{label}</label>
      </div>
      <input
        className="form-input"
        type="number"
        step={step}
        min={0}
        value={value}
        onChange={e=>onChange(e.target.value)}
        style={{height:40,fontSize:13}}
      />
      {sublabel && <p style={{fontSize:10,color:'#334155',marginTop:4}}>{sublabel}</p>}
    </div>
  );
}
