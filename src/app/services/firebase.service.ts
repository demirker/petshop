import { Injectable, inject } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile, sendPasswordResetEmail } from 'firebase/auth';
import { User } from '../models/user.model';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { getFirestore, setDoc, doc, getDoc, addDoc, collection, collectionData, query, updateDoc, deleteDoc, where, docData } from '@angular/fire/firestore';
import { UtilsService } from './utils.service';
import { AngularFireStorage } from '@angular/fire/compat/storage';
import { getStorage, uploadString, ref, getDownloadURL, deleteObject } from "firebase/storage";
import { OrderByDirection, getDocs, orderBy } from 'firebase/firestore';
import { Product } from '../models/product.model';
import { Observable, map } from 'rxjs';


@Injectable({
  providedIn: 'root'
})
export class FirebaseService {

  currentUser: any;

  constructor(
    private auth: AngularFireAuth,
    private firestore: AngularFirestore,
    private storage: AngularFireStorage,
    private utilsSvc: UtilsService
  ) {}


  

  // ============================ Autenticacion ============================

  getAuth() {
    return getAuth();
  }

  // ======== Acceder ========
  signIn(user: User) {
    return signInWithEmailAndPassword(getAuth(), user.email, user.password);
  }

  // ======== crear usuario ========
  signUp(user: User) {
    return createUserWithEmailAndPassword(getAuth(), user.email, user.password);
  }

  // Actualizar usuario  
  updateUser(displayName: string) {
    return updateProfile(getAuth().currentUser, { displayName });
  }

  //  enviar email para restablecer contraseña
  sendRecoveryEmail(email: string) {
    return sendPasswordResetEmail(getAuth(), email);
  }

  // cerrar sesion
  signOut() {
    getAuth().signOut();
    localStorage.removeItem('user');
    this.utilsSvc.routerLink('/auth'); // lo manda para iniciar sesion por seguro
  }

  // ============== base de datos ==================

  //====== Obtener documentos de una colección
  getCollectionData(path: string, collectionQuery?: any) {
    const ref = collection(getFirestore(), path);
    return collectionData(query(ref, ...collectionQuery), { idField: 'id' });
  }

  //setear un documento
  setDocument(path: string, data: any) {
    return setDoc(doc(getFirestore(), path), data);
  }

  //actualizar un documento
  updateDocument(path: string, data: any) {
    return updateDoc(doc(getFirestore(), path), data);
  }

  //eliminar un documento
  deleteDocument(path: string) {
    return deleteDoc(doc(getFirestore(), path));
  }

  //obtener un documento
  async getDocument(path: string) {
    return (await getDoc(doc(getFirestore(), path))).data();
  }

  // agregar un documento
  addDocument(path: string, data: any) {
    return addDoc(collection(getFirestore(), path), data);
  }

  // ====== Obtener el rol del usuario desde Firestore ======
  async getUserRole(userId: string): Promise<string> {
    const userDoc = await this.firestore.doc(`users/${userId}`).get().toPromise();
    const userData = userDoc.data() as any; // Assuming your user document has a field 'role'
    return userData.role; // Assuming 'role' is the field that stores the role of the user
  }

  // ======= lee coleccion ==========
  getCol<tipo>(path: string) {
    return this.firestore.collection<tipo>(path).valueChanges();
  }

  // ====== lee documento ==========
  getDoc<tipo>(path: string, id: string) {
    return this.firestore.collection(path).doc<tipo>(id).valueChanges()
  }

  // ============== Almacenamiento ==================

  //====== Subir Imagen
  async uploadImage(path: string, data_url: string) {
    return uploadString(ref(getStorage(), path), data_url, 'data_url').then(() => {
      return getDownloadURL(ref(getStorage(), path));
    });
  }

  //====== Obtener ruta de la imagen con su url
  async getFilePath(url: string) {
    return ref(getStorage(), url).fullPath;
  }

  //====== Eliminar archivo ====== 
  deleteFile(path: string) {
    return deleteObject(ref(getStorage(), path));
  }

  // obtener id usuario
  getId() {
    const auth = getAuth();
    this.currentUser = auth.currentUser;
    console.log(this.currentUser);
    return this.currentUser?.uid;
  }

  // referencia del documento
  docRef(path) {
    return doc(getFirestore(), path);
  }

  // referencia de la coleccion
  collectionRef(path) {
    return collection(getFirestore(), path)
  }

  // Query coleccion
  collectionDataQuery(path, queryFn?) {
    let dataRef: any = this.collectionRef(path);
    if(queryFn) {
      const q = query(dataRef, queryFn);
      dataRef = q;
    }
    const collection_data = collectionData<any>(dataRef, {idField: 'id'}); //valuechanges, for doc use docdata
    return collection_data;
  }

  // donde la query
  whereQuery(fieldPath, condition, value) {
    return where(fieldPath, condition, value)
  }

  // obtiene documento
  getDocs(path, queryFn?) {
    let dataRef: any = this.collectionRef(path);
    if(queryFn) {
      const q = query(dataRef, queryFn);
      dataRef = q;
    }
    return getDocs<any, any>(dataRef); //get()
  }

  // query documento
  docDataQuery(path, id?, queryFn?) {
    let dataRef: any = this.docRef(path);
    if(queryFn) {
      const q = query(dataRef, queryFn);
      dataRef = q;
    }
    let doc_data;
    if(id) doc_data = docData<any>(dataRef, {idField: 'id'});
    else doc_data = docData<any>(dataRef); //valuechanges, for doc use docData
    return doc_data;
  }

  // ordenar por query
  orderByQuery(fieldPath, directionStr: OrderByDirection = 'asc') {
    return orderBy(fieldPath, directionStr);
  }

  //actualiza documento
  updateDoc(path: string, id:string, data: any) {
    return this.firestore.collection(path).doc(id).update(data)
  }

  //conseguir id de colleccion
  getCollectionDocumentIds(collectionPath: string): Observable<string[]> {
    return this.firestore.collection(collectionPath).snapshotChanges().pipe(
      map(actions => {
        return actions.map(a => a.payload.doc.id);
      })
    );
  }
}