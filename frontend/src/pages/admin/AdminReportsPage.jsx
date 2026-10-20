import {useEffect,useState} from 'react';
import {api} from '../../services/api';

const REASONS={spam:'스팸·광고',abuse:'욕설·괴롭힘',hate:'혐오·차별',sexual:'성적인 내용',other:'기타'};

/** Review queue for member reports on ASBC builds. Nothing is hidden until the administrator acts. */
export default function AdminReportsPage(){
 const [items,setItems]=useState(null),[error,setError]=useState(''),[message,setMessage]=useState(''),[busy,setBusy]=useState(''),[refresh,setRefresh]=useState(0);
 useEffect(()=>{let live=true;api.get('/admin/shadowcraft/reports').then(value=>{if(!value||!Array.isArray(value.items))throw Error('목록 형식 오류');if(live){setItems(value.items);setError('');}}).catch(e=>{if(live){setItems(null);setError(e.message);}});return()=>{live=false};},[refresh]);
 async function resolve(item,action){
  if(action==='delete'&&!confirm('이 빌드를 삭제할까요? 되돌릴 수 없습니다.'))return;
  if(action==='hide'&&!confirm('이 빌드를 비공개로 전환할까요? 빌드 관리에서 다시 공개할 수 있습니다.'))return;
  setBusy(item.targetKey);setError('');setMessage('');
  try{await api.post('/admin/shadowcraft/reports/resolve',{targetKey:item.targetKey,action});setMessage({dismiss:'문제없음으로 처리했습니다.',hide:'빌드를 비공개로 전환했습니다.',delete:'빌드를 삭제했습니다.'}[action]);setRefresh(v=>v+1);}
  catch(e){setError(e.message);}finally{setBusy('');}
 }
 return <div className="max-w-5xl mx-auto px-4 py-8 text-gray-100">
  <h1 className="text-2xl font-bold mb-2">ASBC 신고 관리</h1>
  <p className="text-gray-400 mb-6">회원이 신고한 빌드입니다. 신고만으로 자동으로 숨겨지지 않으며, 여기서 처리해야 반영됩니다.</p>
  {message&&<p role="status" className="text-green-400 mb-4">{message}</p>}
  {error&&<p role="alert" className="text-red-400 mb-4">{error} <button className="text-blue-400 ml-2" onClick={()=>setRefresh(v=>v+1)}>다시 불러오기</button></p>}
  {items===null&&!error&&<p role="status">신고 목록을 불러오는 중…</p>}
  {items&&items.length===0&&<p className="text-gray-400">처리할 신고가 없습니다.</p>}
  {items&&items.length>0&&<ul className="space-y-4" aria-label="신고 목록">{items.map(item=><li key={item.targetKey} className="bg-gray-900 border border-gray-800 rounded-lg p-4">
   <div className="flex flex-wrap items-center gap-2 mb-2"><span className="text-xs px-2 py-1 rounded bg-gray-800">빌드</span><strong>신고 {item.count}건</strong><span className="text-gray-400 text-sm">{[...item.reasons].map(r=>REASONS[r]||r).join(', ')}</span>{!item.published&&<span className="text-xs text-amber-400">비공개 빌드</span>}</div>
   <p className="whitespace-pre-wrap break-words mb-1">{item.text}</p>
   <p className="text-sm text-gray-400 mb-2">작성자 {item.author||'관리자'} · 빌드 「{item.buildTitle}」 · <a className="text-blue-400" href={'https://asbc.app/#published='+item.buildId} target="_blank" rel="noreferrer">공개 화면 열기</a></p>
   {item.details.length>0&&<ul className="text-sm text-gray-300 list-disc ml-5 mb-2">{item.details.map((d,i)=><li key={i} className="break-words">{d}</li>)}</ul>}
   <div className="flex flex-wrap gap-2"><button className="px-3 py-1 rounded bg-gray-700" disabled={busy===item.targetKey} onClick={()=>resolve(item,'dismiss')}>문제없음</button>
    <button className="px-3 py-1 rounded bg-amber-700" disabled={busy===item.targetKey} onClick={()=>resolve(item,'hide')}>빌드 비공개</button>
    <button className="px-3 py-1 rounded bg-red-700" disabled={busy===item.targetKey} onClick={()=>resolve(item,'delete')}>빌드 삭제</button></div>
  </li>)}</ul>}
 </div>;
}
