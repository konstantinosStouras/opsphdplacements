import {initializeApp} from 'https://www.gstatic.com/firebasejs/13.1.0/firebase-app.js';
import {getAuth,GoogleAuthProvider,signInWithPopup,signOut,onAuthStateChanged,setPersistence,inMemoryPersistence} from 'https://www.gstatic.com/firebasejs/13.1.0/firebase-auth.js';
import {getFirestore,doc,getDoc,writeBatch} from 'https://www.gstatic.com/firebasejs/13.1.0/firebase-firestore.js';
import {firebaseConfig,ADMIN_EMAIL} from './firebase-config.js';
const app=initializeApp(firebaseConfig),auth=getAuth(app),db=getFirestore(app);
// Private data is kept in memory; do not enable persistent Firestore caching.
await setPersistence(auth,inMemoryPersistence);
export const authorised = user => user?.email===ADMIN_EMAIL && user.emailVerified && user.providerData.some(provider=>provider.providerId==='google.com');
export const watchUser = callback => onAuthStateChanged(auth,callback);
export const logout = () => signOut(auth);
export async function login(){const provider=new GoogleAuthProvider();provider.setCustomParameters({login_hint:ADMIN_EMAIL});return signInWithPopup(auth,provider);}
const hash = async text => [...new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(text)))].map(byte=>byte.toString(16).padStart(2,'0')).join('');
export async function readCatalog(){
  if(!authorised(auth.currentUser))throw Error('Sign in with the authorised Google account.');
  await auth.currentUser.getIdToken(true);
  const current=await getDoc(doc(db,'adminConfig','current'));
  if(!current.exists())return null;
  const manifest=current.data();
  if(!Number.isInteger(manifest.chunks)||manifest.chunks<1||manifest.chunks>5000)throw Error('Invalid catalog manifest.');
  let text='';
  for(let start=0;start<manifest.chunks;start+=8){
    const parts=await Promise.all(Array.from({length:Math.min(8,manifest.chunks-start)},(_,offset)=>getDoc(doc(db,'adminSnapshots',manifest.snapshotId,'chunks',String(start+offset).padStart(5,'0')))));
    for(const part of parts){if(!part.exists()||typeof part.data().payload!=='string')throw Error('Incomplete private catalog.');text+=part.data().payload;}
  }
  if(await hash(text)!==manifest.sha256)throw Error('Catalog integrity check failed.');
  return JSON.parse(text);
}
export async function importCatalog(file,progress){
  if(!authorised(auth.currentUser))throw Error('Sign in with the authorised Google account.');
  await auth.currentUser.getIdToken(true);
  const text=await file.text(),catalog=JSON.parse(text);
  if(catalog.version!==1||!['people','organisations','graduates'].every(name=>Array.isArray(catalog.tables?.[name])))throw Error('Choose a generated private research catalog.');
  const snapshotId=crypto.randomUUID(),chunks=Math.ceil(text.length/120000);
  const previous=await getDoc(doc(db,'adminConfig','current'));
  for(let start=0;start<chunks;start+=8){
    const batch=writeBatch(db);
    for(let i=start;i<Math.min(start+8,chunks);i++)batch.set(doc(db,'adminSnapshots',snapshotId,'chunks',String(i).padStart(5,'0')),{payload:text.slice(i*120000,(i+1)*120000),index:i});
    await batch.commit();progress(`Saving private records: ${Math.min(start+8,chunks)} of ${chunks} parts`);
  }
  const batch=writeBatch(db);
  batch.set(doc(db,'adminConfig','current'),{snapshotId,chunks,sha256:await hash(text),counts:Object.fromEntries(Object.entries(catalog.tables).map(([key,value])=>[key,value.length])),createdAt:new Date().toISOString(),previousSnapshotId:previous.exists()?previous.data().snapshotId:null});
  await batch.commit();return catalog;
}
