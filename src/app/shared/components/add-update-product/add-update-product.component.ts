import { Component, Input, OnInit, inject } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { Product } from 'src/app/models/product.model';
import { User } from 'src/app/models/user.model';
import { FirebaseService } from 'src/app/services/firebase.service';
import { UtilsService } from 'src/app/services/utils.service';

@Component({
  selector: 'app-add-update-product',
  templateUrl: './add-update-product.component.html',
  styleUrls: ['./add-update-product.component.scss'],
})
export class AddUpdateProductComponent  implements OnInit {
  @Input() product: Product
  form = new FormGroup({
    id: new FormControl(''),
    image: new FormControl('', [Validators.required]),
    name: new FormControl('', [Validators.required, Validators.minLength(4)]),
    price: new FormControl(null, [Validators.required, Validators.min(0)]),
    soldUnits: new FormControl(null, [Validators.required, Validators.min(0)]),
    stockAvailable: new FormControl(null, [Validators.required, Validators.min(0)]), // Nuevo campo
    discount: new FormControl(null, [Validators.min(0), Validators.max(100)]), // Nuevo campo para el descuento
  })

  firebaseSvc = inject(FirebaseService);
  utilsSvc = inject(UtilsService);
  user = {} as User;

  ngOnInit() {
    this.user = this.utilsSvc.getFromLocalStorage('user');
    if (this.product) {
      // Solo establece los valores si el producto existe y tiene las propiedades esperadas
      if ('id' in this.product && 'image' in this.product && 'name' in this.product && 'price' in this.product && 'soldUnits' in this.product) {
        this.form.patchValue(this.product);
      }
    }
  }
  //tomar/seleccionar imagen
  async takeImage(){
    const dataUrl = (await this.utilsSvc.takePicture('Imagen del Producto')).dataUrl;
    this.form.controls.image.setValue(dataUrl);
    
  }

  submit(){
    if (this.form.valid){
      if(this.product) this.updateProduct();
      else this.createProduct()
    }
  }

  //Convierte valores de tipo string a number
  setNumberInputs(){
    let {soldUnits, price} = this.form.controls;
    if(soldUnits.value) soldUnits.setValue(parseFloat(soldUnits.value));
    if(price.value) price.setValue(parseFloat(price.value));
    if (this.form.controls.stockAvailable.value) this.form.controls.stockAvailable.setValue(parseFloat(this.form.controls.stockAvailable.value));
 // Nuevo campo
  }

  //crear producto
  async createProduct() {
    let path = `users/${this.user.uid}/products`;
    const loading = await this.utilsSvc.loading();
    await loading.present();
  
    try {
      // Subir la imagen y obtener URL
      let dataUrl = this.form.value.image;
      let imagePath = `${this.user.uid}/${Date.now()}`;
      let imageUrl = await this.firebaseSvc.uploadImage(imagePath, dataUrl);
      this.form.controls.image.setValue(imageUrl);
  
      // Crear el documento sin el campo 'id'
      let productData = this.form.value;
      delete productData.id;
  
      // dar valor al id
      let docRef = await this.firebaseSvc.addDocument(path, productData);
      let productId = docRef.id;
  
      // Actualizar el documento con el campo 'id'
      await this.firebaseSvc.updateDocument(`${path}/${productId}`, { id: productId });
  
      // Actualizar el formulario con el nuevo ID
      this.form.controls.id.setValue(productId);
  
      // Mostrar mensaje de éxito
      this.utilsSvc.dismissModal({ success: true });
      this.utilsSvc.presentToast({
        message: 'Producto creado exitosamente',
        duration: 1500,
        color: 'success',
        position: 'middle',
        icon: 'checkmark-circle-outline'
      });
    } catch (error) {
      console.log(error);
      this.utilsSvc.presentToast({
        message: error.message,
        duration: 2500,
        color: 'primary',
        position: 'middle',
        icon: 'alert-circle-outline'
      });
    } finally {
      loading.dismiss();
    }
  }

  //actualizar producto
  async updateProduct(){
      let path = `users/${this.user.uid}/products/${this.product.id}`
      const loading = await this.utilsSvc.loading();
      await loading.present();
      // si se cambia la imagen , subir la nueva imagen y obtener url
      if(this.form.value.image !== this.product.image){
        let dataUrl = this.form.value.image;
        let imagePath = await this.firebaseSvc.getFilePath(this.product.image);
        let imageUrl = await this.firebaseSvc.uploadImage(imagePath, dataUrl);
        this.form.controls.image.setValue(imageUrl);
      }
      delete this.form.value.id
      this.firebaseSvc.updateDocument(path, this.form.value).then(async res => {
        this.utilsSvc.dismissModal({ success: true });
        this.utilsSvc.presentToast({
          message: 'Producto actualizado exitosamente',
          duration: 1500,
          color: 'success',
          position: 'middle',
          icon: 'checkmark-circle-outline'
        })
      }).catch(error=>{
        console.log(error);
        this.utilsSvc.presentToast({
          message: error.message,
          duration: 2500,
          color: 'primary',
          position: 'middle',
          icon: 'alert-circle-outline'
        })
      }).finally(()=> {
        loading.dismiss();
      })
  }
}
