import { useState, useEffect, useRef } from 'react';
import { Wallet, CreditCard, CheckCircle, AlertCircle, Plus, Zap, RefreshCw, Clock } from 'lucide-react';
import { getWalletBalance, createRazorpayOrder } from '../api';
import { useAuth } from '../AuthContext';
import toast from 'react-hot-toast';

const PRESETS = [100, 200, 500, 1000, 2000, 5000];
const POLL_INTERVAL_MS = 4000;  // poll every 4s
const POLL_MAX_ATTEMPTS = 15;   // give up after ~60s

function loadRazorpay() {
  return new Promise((resolve) => {
    if (window.Razorpay) { resolve(true); return; }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload  = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export default function PaymentPage() {
  const { user } = useAuth();
  const [balance, setBalance]           = useState(null);
  const [loadingBalance, setLoadingBalance] = useState(true);
  const [amount, setAmount]             = useState('');
  const [paying, setPaying]             = useState(false);
  const [waitingWebhook, setWaitingWebhook] = useState(false); // polling for webhook
  const [lastPaid, setLastPaid]         = useState(null);
  const pollRef = useRef(null);

  const fetchBalance = async (silent = false) => {
    if (!silent) setLoadingBalance(true);
    try {
      const res = await getWalletBalance();
      return res.walletBalanceInr ?? 0;
    } catch {
      return 0;
    } finally {
      if (!silent) setLoadingBalance(false);
    }
  };

  const refreshBalance = async () => {
    setLoadingBalance(true);
    const bal = await fetchBalance(true);
    setBalance(bal);
    setLoadingBalance(false);
  };

  useEffect(() => {
    refreshBalance();
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, []);

  // After Razorpay handler fires, poll until balance increases (webhook has credited)
  const startPollingForCredit = (paidAmount, balanceBefore) => {
    setWaitingWebhook(true);
    let attempts = 0;

    pollRef.current = setInterval(async () => {
      attempts++;
      const newBalance = await fetchBalance(true);

      if (newBalance > balanceBefore) {
        // Wallet credited — webhook processed
        clearInterval(pollRef.current);
        pollRef.current = null;
        setBalance(newBalance);
        setLastPaid(paidAmount);
        setWaitingWebhook(false);
        toast.success(`₹${paidAmount} credited! Wallet: ₹${newBalance.toFixed(2)}`);
        return;
      }

      setBalance(newBalance); // update display even if not credited yet

      if (attempts >= POLL_MAX_ATTEMPTS) {
        clearInterval(pollRef.current);
        pollRef.current = null;
        setWaitingWebhook(false);
        // Show balance as-is and tell user to manually refresh
        toast('Payment received. Balance will update once confirmed by Razorpay — click Refresh if needed.', { icon: '⏳', duration: 6000 });
      }
    }, POLL_INTERVAL_MS);
  };

  const handlePay = async () => {
    const amt = Number(amount);
    if (!amt || amt < 100) return toast.error('Minimum recharge amount is ₹100');

    setPaying(true);
    try {
      const loaded = await loadRazorpay();
      if (!loaded) { toast.error('Could not load Razorpay. Check your connection.'); setPaying(false); return; }

      const idempotencyKey = `recharge-${user?.id}-${Date.now()}`;
      const orderRes = await createRazorpayOrder(amt, idempotencyKey);

      // Capture balance before payment to detect the increase
      const balanceBefore = balance ?? 0;

      const options = {
        key:         orderRes.keyId,
        amount:      orderRes.order.amountPaise,
        currency:    orderRes.order.currency,
        name:        'AutoGrade.ai',
        description: `Wallet Recharge — ₹${amt}`,
        order_id:    orderRes.order.orderId,
        prefill: {
          name:  user?.fullName || '',
          email: user?.email   || '',
        },
        theme: { color: '#059669' },
        handler: () => {
          // Payment captured on Razorpay's side — webhook may take a few seconds
          setPaying(false);
          setAmount('');
          toast('Payment successful! Waiting for wallet credit…', { icon: '⏳', duration: 4000 });
          startPollingForCredit(amt, balanceBefore);
        },
        modal: {
          ondismiss: () => setPaying(false),
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

  return (
    <div className="page-wrap" style={{maxWidth:760}}>
      {/* Header */}
      <div className="fade-up" style={{marginBottom:32}}>
        <p className="page-eyebrow">Billing</p>
        <h1 className="page-title">Wallet & Credits</h1>
        <p className="page-sub">Recharge your wallet to continue grading beyond the free tier.</p>
      </div>

      {/* Wallet balance card */}
      <div className="glass-card fade-up" style={{padding:28,marginBottom:24,animationDelay:'0.05s'}}>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:12}}>
          <div style={{display:'flex',alignItems:'center',gap:16}}>
            <div style={{width:52,height:52,borderRadius:14,background:'rgba(16,185,129,0.1)',border:'1px solid rgba(16,185,129,0.2)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
              <Wallet size={24} color="#34d399"/>
            </div>
            <div>
              <div style={{fontSize:12,color:'#475569',marginBottom:4,textTransform:'uppercase',letterSpacing:'0.06em'}}>Wallet Balance</div>
              {loadingBalance ? (
                <div className="skeleton" style={{height:32,width:100}}/>
              ) : (
                <div style={{fontSize:32,fontWeight:700,fontFamily:'monospace',color:'#34d399'}}>
                  ₹{(balance ?? 0).toFixed(2)}
                </div>
              )}
            </div>
          </div>
          <button
            className="btn btn-outline btn-sm"
            onClick={refreshBalance}
            disabled={loadingBalance || waitingWebhook}
            style={{display:'flex',alignItems:'center',gap:6}}
          >
            <RefreshCw size={13} className={loadingBalance?'spin-anim':''}/>
            Refresh
          </button>
        </div>

        {/* Webhook polling status */}
        {waitingWebhook && (
          <div style={{marginTop:16,padding:'12px 16px',borderRadius:10,background:'rgba(234,179,8,0.08)',border:'1px solid rgba(234,179,8,0.25)',display:'flex',alignItems:'center',gap:10,fontSize:13,color:'#facc15'}}>
            <Clock size={15} style={{flexShrink:0,animation:'spin 2s linear infinite'}}/>
            <span>Payment received — waiting for wallet credit confirmation. This usually takes a few seconds…</span>
          </div>
        )}

        {/* Success banner */}
        {lastPaid && !waitingWebhook && (
          <div style={{marginTop:16,padding:'10px 14px',borderRadius:10,background:'rgba(16,185,129,0.07)',border:'1px solid rgba(16,185,129,0.2)',display:'flex',alignItems:'center',gap:8,fontSize:13,color:'#34d399'}}>
            <CheckCircle size={14}/>
            ₹{lastPaid} successfully credited to your wallet!
          </div>
        )}
      </div>

      {/* Free tier info */}
      <div className="glass-card fade-up" style={{padding:20,marginBottom:24,animationDelay:'0.08s',display:'flex',gap:14}}>
        <AlertCircle size={18} color="#a78bfa" style={{flexShrink:0,marginTop:2}}/>
        <div style={{fontSize:13,color:'#94a3b8',lineHeight:1.7}}>
          <strong style={{color:'#f1f5f9'}}>Free tier:</strong> Every account gets <strong style={{color:'#a78bfa'}}>5 free grading submissions</strong>. After that, grading is automatically billed from your wallet balance at cost + 30% platform fee. Recharge your wallet before starting a large grading job.
        </div>
      </div>

      {/* Recharge form */}
      <div className="glass-card fade-up" style={{padding:28,animationDelay:'0.12s'}}>
        <h2 style={{fontSize:16,fontWeight:600,marginBottom:6,display:'flex',alignItems:'center',gap:8}}>
          <Plus size={16} color="#34d399"/> Recharge Wallet
        </h2>
        <p style={{fontSize:12,color:'#475569',marginBottom:20}}>Minimum recharge: ₹100. Credited after Razorpay confirms payment (usually within seconds).</p>

        {/* Preset amounts */}
        <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:10,marginBottom:20}}>
          {PRESETS.map(p => (
            <button
              key={p}
              onClick={() => setAmount(String(p))}
              style={{
                padding:'12px 8px',borderRadius:10,
                border:`1px solid ${Number(amount)===p?'rgba(16,185,129,0.5)':'rgba(255,255,255,0.08)'}`,
                background: Number(amount)===p ? 'rgba(16,185,129,0.1)' : 'rgba(255,255,255,0.02)',
                color: Number(amount)===p ? '#34d399' : '#94a3b8',
                cursor:'pointer',fontSize:14,fontWeight:500,fontFamily:'monospace',
                transition:'all 0.15s',
              }}
            >
              ₹{p}
            </button>
          ))}
        </div>

        {/* Custom amount */}
        <div style={{marginBottom:20}}>
          <label className="form-label">CUSTOM AMOUNT (INR)</label>
          <div style={{position:'relative'}}>
            <span style={{position:'absolute',left:14,top:'50%',transform:'translateY(-50%)',color:'#475569',fontSize:16,fontFamily:'monospace',pointerEvents:'none'}}>₹</span>
            <input
              className="form-input"
              type="number"
              min={100}
              step={50}
              placeholder="Enter amount (min. 100)"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              style={{height:52,paddingLeft:32,fontSize:16,fontFamily:'monospace'}}
            />
          </div>
          {Number(amount) > 0 && Number(amount) < 100 && (
            <p style={{fontSize:11,color:'#f87171',marginTop:4}}>Minimum recharge amount is ₹100</p>
          )}
        </div>

        {/* Pay button */}
        <button
          className="btn btn-sync"
          style={{width:'100%',justifyContent:'center',height:52,fontSize:15}}
          onClick={handlePay}
          disabled={paying || waitingWebhook || !amount || Number(amount) < 100}
        >
          {paying
            ? <><span className="spinner" style={{width:16,height:16}}/> Opening Payment…</>
            : waitingWebhook
            ? <><span className="spinner" style={{width:16,height:16}}/> Confirming…</>
            : <><CreditCard size={16}/> Pay ₹{amount || '0'} via Razorpay</>
          }
        </button>

        <p style={{fontSize:11,color:'#334155',textAlign:'center',marginTop:12,lineHeight:1.6}}>
          Secure payment powered by Razorpay. Your card details are never stored on our servers.
        </p>
      </div>

      {/* Pricing info */}
      <div className="glass-card fade-up" style={{padding:24,marginTop:20,animationDelay:'0.16s'}}>
        <h3 style={{fontSize:14,fontWeight:600,marginBottom:16,color:'#94a3b8',display:'flex',alignItems:'center',gap:7}}>
          <Zap size={14} color="#34d399"/> How billing works
        </h3>
        <div style={{display:'flex',flexDirection:'column',gap:10}}>
          {[
            {label:'Free tier',     val:'5 submissions / account', color:'#34d399'},
            {label:'Gemini Input',  val:'₹0.15 / 1k tokens',       color:'#94a3b8'},
            {label:'Gemini Output', val:'₹0.60 / 1k tokens',       color:'#94a3b8'},
            {label:'OCR Processing',val:'₹0.80 / page',            color:'#94a3b8'},
            {label:'GCS Storage',   val:'₹2.00 / GB',              color:'#94a3b8'},
            {label:'GCS Egress',    val:'₹7.00 / GB',              color:'#94a3b8'},
            {label:'Platform fee',  val:'30% of base cost',         color:'#a78bfa'},
          ].map(r => (
            <div key={r.label} style={{display:'flex',justifyContent:'space-between',fontSize:12,alignItems:'center'}}>
              <span style={{color:'#475569'}}>{r.label}</span>
              <span style={{color:r.color,fontFamily:'monospace',fontWeight:500}}>{r.val}</span>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .spin-anim { animation: spin 0.8s linear infinite; }
      `}</style>
    </div>
  );
}
