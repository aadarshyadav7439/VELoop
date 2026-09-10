import {CheckCircle2,LoaderCircle,X} from "lucide-react";
import {useEffect,useState} from "react";
import {giveawayApi} from "../../services/giveawayApi";
import styles from "./PrizeClaimModal.module.css";

const initial={fullName:"",phone:"",address:"",city:"",state:"",pinCode:"",email:""};

/**
 * `giveawayId` is required now that submission hits the real
 * POST /giveaways/:id/claim endpoint. Which fields are sent depends on
 * prize.claimType — the backend independently re-validates that too, this
 * is just so the right inputs render.
 */
export default function PrizeClaimModal({prize,winner,giveawayId,onClose,onSubmitted}){
 const gift=prize.claimType==='EMAIL';
 const [status,setStatus]=useState(winner?.claimStatus&&winner.claimStatus!=='NOT_SUBMITTED'?winner.claimStatus:'form');
 const [form,setForm]=useState(initial);
 const [error,setError]=useState("");
 useEffect(()=>{const f=e=>e.key==='Escape'&&onClose();window.addEventListener('keydown',f);return()=>window.removeEventListener('keydown',f)},[onClose]);
 const update=e=>setForm(v=>({...v,[e.target.name]:e.target.value}));

 const submit=async e=>{
  e.preventDefault();
  setError("");
  setStatus('PROCESSING');
  try{
   const payload=gift?{email:form.email}:{fullName:form.fullName,phone:form.phone,address:form.address,city:form.city,state:form.state,pinCode:form.pinCode};
   const result=await giveawayApi.claim(giveawayId,payload);
   setStatus(result?.status||'SUBMITTED');
   onSubmitted?.(result);
  }catch(err){
   setError(err.message||"We couldn't submit your claim. Please try again.");
   setStatus('form');
  }
 };

 if(status!=='NOT_SUBMITTED'&&status!=='form')return <div className={styles.backdrop}><div className={styles.modal} role="dialog" aria-modal="true"><button className={styles.close} onClick={onClose} aria-label="Close"><X size={17}/></button>{status==='PROCESSING'?<div className={styles.state}><LoaderCircle className={styles.spin} size={34}/><h2>Verifying your claim</h2><p>Prize verification is in progress.</p></div>:<div className={styles.state}><div className={styles.successIcon}><CheckCircle2 size={27}/></div><span className={styles.eyebrow}>CLAIM SUBMITTED</span><h2>You're all set.</h2><p>Our team can now process the <b>{prize.name}</b> claim.</p><button className={styles.primary} onClick={onClose}>Done</button></div>}</div></div>;

 return <div className={styles.backdrop} onMouseDown={e=>e.target===e.currentTarget&&onClose()}><div className={styles.modal} role="dialog" aria-modal="true" aria-labelledby="claim-title"><button className={styles.close} onClick={onClose} aria-label="Close"><X size={17}/></button><span className={styles.eyebrow}>WINNER CLAIM</span><h2 id="claim-title">Claim your {prize.name}.</h2><p>Winner status: <b>Verified winner</b>. Submit only the information needed to fulfill this reward.</p><div className={styles.claimMeta}><span>Claim deadline</span><b>{winner?.claimDeadline?new Date(winner.claimDeadline).toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'}):'7 days from announcement'}</b></div>{error&&<div className={styles.errorBanner}>{error}</div>}<form onSubmit={submit}>{gift?<Field label="Email address" name="email" type="email" value={form.email} onChange={update} required placeholder="you@example.com"/>:<><Field label="Full name" name="fullName" value={form.fullName} onChange={update} required/><Field label="Phone number" name="phone" value={form.phone} onChange={update} required/><Field label="Complete address" name="address" value={form.address} onChange={update} required textarea/><div className={styles.row}><Field label="City" name="city" value={form.city} onChange={update} required/><Field label="State" name="state" value={form.state} onChange={update} required/><Field label="PIN" name="pinCode" value={form.pinCode} onChange={update} required/></div></>}<button className={styles.primary} type="submit">Submit claim</button><small>Sensitive fulfillment details are sent directly to the backend and never stored in the frontend.</small></form></div></div>;
}
function Field({label,name,value,onChange,type='text',required,textarea,placeholder}){return <label className={styles.field}><span>{label}</span>{textarea?<textarea name={name} value={value} onChange={onChange} required={required} placeholder={placeholder}/>:<input name={name} value={value} onChange={onChange} type={type} required={required} placeholder={placeholder}/>}</label>}
