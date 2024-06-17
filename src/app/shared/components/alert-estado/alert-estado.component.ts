import { Component, Input, OnInit, inject } from '@angular/core';
import { AlertController } from '@ionic/angular';
import { User } from 'firebase/auth';
import { Encargo } from 'src/app/models/encargo.model';
import { Product } from 'src/app/models/product.model';
import { FirebaseService } from 'src/app/services/firebase.service';
import { UtilsService } from 'src/app/services/utils.service';

@Component({
  selector: 'app-alert-estado',
  templateUrl: './alert-estado.component.html',
  styleUrls: ['./alert-estado.component.scss'],
})
export class AlertEstadoComponent implements OnInit {
  firebaseSvc = inject(FirebaseService);
  utilsSvc = inject(UtilsService);
  alert = inject(AlertController);

  @Input() rol: string;
  @Input() Encargo: Encargo;

  users: User[];
  products: Product[];

  //obtener usuario
  user() {
    const userString = localStorage.getItem('user');
    return userString ? JSON.parse(userString) : null;
  }

  constructor() {}

  ngOnInit() {}

  cambiarEstado() {
    if (this.Encargo.estado == 'pendiente') {
      this.editar('estado', 'en camino/espera');
    }
    if (this.Encargo.estado == 'en camino/espera') {
      this.editar('estado', 'entregado');
    }
    if (this.Encargo.estado == 'entregado') {
      console.log('encargo ya ha sido entregado');
    }
  }

  //alert editar info
  async editar(atr: string, nuevo: string) {
    const alert = await this.alert.create({
      header: 'Editar ' + atr,
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
            this.saveAtri(nuevo);
          },
        },
      ],
    });
    await alert.present();
  }

  // guardar atributo cambiado
  saveAtri(nuevo: string) {
    let path = `encargos/${this.Encargo.idE}`;
    this.firebaseSvc
      .updateDocument(path, { estado: nuevo })
      .then(async (res) => {
        if (nuevo == 'en camino/espera') {
          this.bajarStock();
        }
        this.utilsSvc.presentToast({
          message: 'Encargo modificado exitosamente',
          duration: 1500,
          color: 'success',
          position: 'middle',
          icon: 'checkmark-circle-outline',
        });
        // setTimeout(() => {
        //   window.location.reload();
        // }, 2500);
      });
  }

  bajarStock() {
    let path = `encargos/${this.Encargo.idE}`;
    this.firebaseSvc
      .getCol<Product>(`users/${this.user().uid}/productos`)
      .subscribe((pro) => {
        if (pro) {
          this.products = pro;
          for (const product of this.products) {
            this.Encargo.productos.forEach((productop) => {
              if (productop.id == product.id) {
                let stockNuevo = product.stockAvailable - productop.cantidad;
                this.firebaseSvc.updateDocument(path, {
                  stock: stockNuevo,
                });
              }
            });
          }
          console.log('stock se bajo');
        } else {
          console.log('no se encontraron productos');
        }
      });
  }
}
