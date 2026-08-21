import{applicationDefault,cert,initializeApp}from'firebase-admin/app';
import{getFirestore,FieldValue}from'firebase-admin/firestore';
import fs from'node:fs';
const servicePath=process.env.GOOGLE_APPLICATION_CREDENTIALS;
const credential=servicePath&&fs.existsSync(servicePath)?cert(JSON.parse(fs.readFileSync(servicePath,'utf8'))):applicationDefault();
initializeApp({credential});const db=getFirestore();
const houses=['F','E','A','T'];const families=houses.flatMap(h=>Array.from({length:8},(_,i)=>`${h}-${String(i+1).padStart(2,'0')}`));
const slots=[['13:30','13:40'],['13:45','13:55'],['14:00','14:10'],['14:15','14:25'],['14:30','14:40'],['14:45','14:55'],['15:00','15:10'],['15:15','15:25']];
function make(sport,first,second){return slots.flatMap(([startTime,endTime],slot)=>{const pair=slot<4?first:second,n=slot%4*2+1;return[0,1].map(c=>({id:`${sport}-${startTime.replace(':','')}-c${c+1}`,sport,familyA:`${pair[0]}-${String(n+c).padStart(2,'0')}`,familyB:`${pair[1]}-${String(n+c).padStart(2,'0')}`,houseA:pair[0],houseB:pair[1],court:c+1,startTime,endTime,scoreA:null,scoreB:null,status:'upcoming',version:0}))})}
const matches=[...make('badminton',['F','T'],['A','E']),...make('volleyball',['A','E'],['F','T'])];
const batch=db.batch();for(const h of houses)batch.set(db.doc(`houses/${h}`),{code:h,name:`House ${h}`});for(const f of families)batch.set(db.doc(`families/${f}`),{code:f,house:f[0]});for(const s of ['badminton','volleyball'])batch.set(db.doc(`sports/${s}`),{code:s});for(const m of matches){const{id,...data}=m;batch.set(db.doc(`matches/${id}`),data,{merge:true})}batch.set(db.doc('settings/event'),{name:'Family Day – Giao lưu thể thao',school:'Lawrence S. Ting School',date:'2026-08-21',startTime:'13:30',endTime:'15:30',scoringMethod:'raw_scores',updatedAt:FieldValue.serverTimestamp()},{merge:true});
const adminEmail=process.env.INITIAL_ADMIN_EMAIL?.toLowerCase();if(adminEmail)batch.set(db.doc(`users/${adminEmail}`),{email:adminEmail,role:'admin',active:true,createdAt:FieldValue.serverTimestamp()},{merge:true});await batch.commit();console.log(`Seeded ${matches.length} matches, ${families.length} families${adminEmail?`, and admin ${adminEmail}`:''}.`);
