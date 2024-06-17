import { Component, OnInit, inject } from '@angular/core';
import { AlertController } from '@ionic/angular';
import { User } from 'src/app/models/user.model';
import { FirebaseService } from 'src/app/services/firebase.service';
import { UtilsService } from 'src/app/services/utils.service';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.page.html',
  styleUrls: ['./profile.page.scss'],
})
export class ProfilePage implements OnInit {
  firebaseSvc = inject(FirebaseService);
  utilsSvc = inject(UtilsService);
  alert = inject(AlertController);

  userRole: string = 'Dueño'; // Variable to store the user role

  ngOnInit() {
    this.loadUserRole();
  }

  async loadUserRole() {
    const user = this.user();
    try {
      this.userRole = await this.firebaseSvc.getUserRole(user.uid);
    } catch (error) {
      console.error('Error loading user role:', error);
    }
  }

  user(): User {
    return this.utilsSvc.getFromLocalStorage('user');
  }

  //tomar/seleccionar imagen
  async takeImage() {
    let user = this.user();
    let path = `users/${user.uid}`;
    const dataUrl = (await this.utilsSvc.takePicture('Imagen del Perfil'))
      .dataUrl;

    const loading = await this.utilsSvc.loading();
    await loading.present();

    let imagePath = `${user.uid}/profile`;
    user.image = await this.firebaseSvc.uploadImage(imagePath, dataUrl);

    this.firebaseSvc
      .updateDocument(path, { image: user.image })
      .then(async (res) => {
        this.utilsSvc.saveInLocalStorage('user', user);

        this.utilsSvc.presentToast({
          message: 'Imagen actualizada exitosamente',
          duration: 1500,
          color: 'success',
          position: 'middle',
          icon: 'checkmark-circle-outline',
        });
      })
      .catch((error) => {
        console.log(error);

        this.utilsSvc.presentToast({
          message: error.message,
          duration: 2500,
          color: 'primary',
          position: 'middle',
          icon: 'alert-circle-outline',
        });
      })
      .finally(() => {
        loading.dismiss();
      });
  }

  //alert editar info
  async editar(atr: string, name: string) {
    const alert = await this.alert.create({
      header: 'Editar ' + name,
      inputs: [
        {
          name: atr,
          type: 'text',
          placeholder: 'ingresa ' + name,
        },
      ],
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel',
          handler: () => {
            console.log('confirm cancel');
          },
        },
        {
          text: 'Ok',
          role: 'ok',
          handler: (ev) => {
            console.log('confirm Ok ', ev);
            this.saveAtri(atr, ev[atr]);
          },
        },
      ],
    });
    await alert.present();
  }

  // guardar atributo cambiado
  saveAtri(name: string, input: any) {
    this.utilsSvc.showLoading('Actualizando...');
    const id = this.user().uid;
    const updateDoc: any = {};
    updateDoc[name] = input;
    this.firebaseSvc
      .updateDoc('users', id, updateDoc)
      .then(() => {
        console.log('Exito al actualizar el documento:');
        let path = `users/${id}`;
        this.utilsSvc.removeFromLocalStorage('users');
        this.firebaseSvc.getDocument(path).then((R: User) => {
          this.utilsSvc.saveInLocalStorage('user', R);
        });
        this.utilsSvc.hideLoading();
        this.utilsSvc.presentToast2('Actualizado con exito');
      })
      .catch((error) => {
        console.error('Error al actualizar el documento:', error);
        this.utilsSvc.hideLoading();
        this.utilsSvc.presentToast2('Error al actualizar');
      });
  }
}
