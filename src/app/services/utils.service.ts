import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AlertController, AlertOptions, LoadingController, ModalController, ModalOptions, ToastController, ToastOptions } from '@ionic/angular';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';



@Injectable({
  providedIn: 'root'
})
export class UtilsService {

  loadingCtrl = inject(LoadingController);
  toastCtrl = inject(ToastController);
  modalCtrl = inject(ModalController);
  router = inject(Router);
  alertCtrl = inject(AlertController)
  toastController: any;
  
  private loadingT: any; 

  async takePicture (promptLabelHeader: string){
  return await Camera.getPhoto({
    quality: 90,
    allowEditing: true,
    resultType: CameraResultType.DataUrl,
    source: CameraSource.Prompt,
    promptLabelHeader,
    promptLabelPhoto: 'Selecciona una imagen',
    promptLabelPicture: 'Toma una foto'
  });

};

  


  // ALERTA
  async presentAlert(opts?: AlertOptions) {
    const alert = await this.alertCtrl.create(opts);
  
    await alert.present();
  }



  //loading

  loading(){
    return this.loadingCtrl.create({spinner: 'crescent'})
  }



  //toast

  async presentToast(opts?: ToastOptions) {
    const toast = await this.toastCtrl.create(opts);  
    toast.present();
  }


  // enruta a cualquier pagina disponible

  routerLink(url: string){
    return this.router.navigateByUrl(url);
  }


  // guarda un elemento en localstorage

  saveInLocalStorage(key: string, value: any){
    return localStorage.setItem(key, JSON.stringify(value))
  }


  // obtiene un elemento desde localstorage

  getFromLocalStorage(key: string){
    return JSON.parse(localStorage.getItem(key))
  }

  // Borra un elemento del localStorage
  removeFromLocalStorage(key: string) {
    localStorage.removeItem(key);
  }

  // modal

  async presentModal(opts: ModalOptions) {
    const modal = await this.modalCtrl.create(opts);

  
    await modal.present();

    const { data } = await modal.onWillDismiss();
    if(data) return data;
  }

  dismissModal(data?: any){
    return this.modalCtrl.dismiss(data);
  }

  //perfil

  //Notificacion por pantalla
  async presentToast2(mensaje: string) {
    const toast = await this.toastController.create({
      message: mensaje,
      duration: 2000,
      cssClass: 'notificacion-pantalla-usuario',
      position: "middle"
    });
    await toast.present();
  }

  //Inicia la carga por pantalla
  async showLoading(mensaje: string) {
    this.loadingT = await this.loadingCtrl.create({
      message: mensaje,
    });
  await this.loadingT.present();
  }

  //Termina la carga por pantalla
  async hideLoading() {
    if (this.loading) {
      await this.loadingT.dismiss();
    }
  }
}
