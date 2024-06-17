import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { Product } from 'src/app/models/product.model';
import { User } from 'src/app/models/user.model';
import { FirebaseService } from 'src/app/services/firebase.service';
import { UtilsService } from 'src/app/services/utils.service';
import { AddUpdateProductComponent } from 'src/app/shared/components/add-update-product/add-update-product.component';
import { orderBy } from 'firebase/firestore';
import { Observable, take } from 'rxjs';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { NavigationExtras, Router } from '@angular/router';
import { ChatService } from 'src/app/services/chat.service';
import { CarritoService } from 'src/app/services/carrito.service'; // Importamos el servicio del carrito
import { Encargo } from 'src/app/models/encargo.model';

@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
})
export class HomePage implements OnInit {
  // Inyectamos los servicios
  firebaseSvc = inject(FirebaseService);
  utilsSvc = inject(UtilsService);
  carritoSvc = inject(CarritoService);
  cdr = inject(ChangeDetectorRef);

  // declaraciones
  products: Product[] = [];
  loading: boolean = false;
  rol: any = this.user().role;
  users: User[];
  usuarios: User[];
  encargos: Encargo[];

  //encargo
  data: Encargo = {
    estado: 'pendiente',
    idC: '',
    idE: '',
    productos: [],
    totalPagar: 0,
    modalidad: '',
    metodoPago: '',
  };

  //declaraciones varias
  router = inject(Router);
  //selector
  segment = 'catalogo';
  //gps
  direccion: string = this.user().direccion;
  sanitizer = inject(DomSanitizer);
  //chat
  chatService = inject(ChatService);
  open_new_chat = false;
  usersChats: Observable<any[]>;
  chatRooms: Observable<any[]>;
  model = {
    icon: 'chatbubbles-outline',
    title: 'No chatrooms',
    color: 'warning',
  };
  //encargo
  usuario = {} as User;

  // Función para agregar un producto al carrito
  constructor() {
    this.carritoSvc.getCarritoActualizado().subscribe(() => {
      this.cdr.detectChanges();
    });
  }

  // al iniciar pagina
  ngOnInit() {
    this.getRooms();
    this.usuario = this.utilsSvc.getFromLocalStorage('user');
  }

  // Función para agregar un producto al carrito
  addToCart(producto: Product, cantidad: number) {
    this.carritoSvc.addToCart(producto, cantidad);
  }

  // Función asincrónica para seleccionar la cantidad de un producto a agregar al carrito
  async selectQuantity(producto: Product) {
    const stockDisponible = this.getStockDisponible(producto);
    const prompt = await this.utilsSvc.alertCtrl.create({
      header: 'Seleccionar Cantidad',
      inputs: [
        {
          name: 'cantidad',
          type: 'number',
          min: 1,
          max: stockDisponible, // Establece el máximo como el stock disponible
          value: '1', // Valor por defecto
          placeholder: 'Cantidad'
        }
      ],
      buttons: [
        {
          text: 'Cancelar',
          handler: () => {
            console.log('Cancelar');
          }
        },
        {
          text: 'Agregar al Carrito',
          handler: (data) => {
            const cantidad = parseInt(data.cantidad, 10);
            // Verifica si la cantidad seleccionada excede el stock disponible
            if (cantidad > stockDisponible) {
              this.presentCantidadExcedidaAlert(stockDisponible);
            } else {
              this.addToCart(producto, cantidad); // Agrega el producto al carrito
            }
          }
        }
      ]
    });
    await prompt.present(); // Muestra el cuadro de diálogo para seleccionar cantidad
  }

  // Función privada asincrónica para mostrar una alerta cuando la cantidad seleccionada excede el stock disponible
  private async presentCantidadExcedidaAlert(stockDisponible: number) {
    await this.utilsSvc.presentAlert({
      header: 'Cantidad excedida',
      message: `La cantidad seleccionada supera el stock disponible (${stockDisponible}). Por favor, elige una cantidad menor.`,
      buttons: ['Aceptar']
    });
  }

  // Función para eliminar una cantidad específica de un producto del carrito
  removeFromCart(producto: Product, cantidad: number) {
    this.carritoSvc.removeFromCart(producto, cantidad);
  }

  // Método para eliminar todos los productos del carrito
  removeAllFromCart(producto: Product) {
    const quantity = this.carritoSvc.getProductQuantityInCart(producto);
    this.carritoSvc.removeFromCart(producto, quantity);
  }

  // Función para obtener la cantidad disponible en stock de un producto
  getStockDisponible(producto: Product): number {
    return producto.stockAvailable;
  }


  // conseguir cantidad de producto en carrito
  getProductQuantityInCart(product: Product): number {
    return this.carritoSvc.getProductQuantityInCart(product);
  }

  // obtiene lista de chats
  getRooms() {
    this.chatService.getChatRooms();
    this.chatRooms = this.chatService.chatRooms;
    console.log('chatrooms: ', this.chatRooms);
  }

  // evento selector
  onSegmentChanged(event: any) {
    console.log(event);
    this.segment = event.detail.value;
  }

  // abre lista chats nuevos
  newChat() {
    this.open_new_chat = true;
    if (!this.usersChats) this.getUsers();
  }

  // obtiene usuarios chats
  getUsers() {
    this.chatService.getUsers();
    this.usersChats = this.chatService.users;
  }

  // evento cierre lista chats nuevos
  onWillDismiss(event: any) {}

  // cierra lista chats nuevos
  cancel() {
    this.open_new_chat = false;
  }

  // crea chat y dirige a este
  async startChat(item) {
    try {
      this.cancel();
      const room = await this.chatService.createChatRoom(item?.uid);
      console.log('room', room);
      console.log('navegando hacia: ', room?.id);
      const navData: NavigationExtras = {
        queryParams: {
          name: item?.name,
        },
      };
      this.router.navigate(['/', 'main', 'home', 'chats', room?.id], navData);
    } catch (e) {
      console.log(e);
    }
  }

  // dirige a chat
  getChat(item) {
    item?.user.pipe(take(1)).subscribe((user_data) => {
      console.log('data: ', user_data);
      console.log('navegando hacia: ', item?.id);
      const navData: NavigationExtras = {
        queryParams: {
          name: user_data?.name,
        },
      };
      this.router.navigate(['/', 'main', 'home', 'chats', item?.id], navData);
    });
  }

  getUser(user: any) {
    return user;
  }

  //src del maps
  getGoogleMapsUrl(): SafeResourceUrl {
    const baseUrl = 'https://www.google.com/maps/embed/v1/directions';
    const origin = 'Duoc UC: Sede Maipu';
    const apiKey = 'AIzaSyBS5WPn6lWbfaYR4ZXpsgD-_c98-wmbfS0';
    //constante que agrupa todo
    const url = `${baseUrl}?origin=${origin}&destination=${this.direccion}&key=${apiKey}&center=-33.51115192766463,-70.75249220424112&zoom=13`;
    // Marcar la URL como segura
    return this.sanitizer.bypassSecurityTrustResourceUrl(url);
  }

  //obtener usuario
  user() {
    const userString = localStorage.getItem('user');
    return userString ? JSON.parse(userString) : null;
  }

  //refrescador al entrar / funciona ahora sabiendo si es usuario o dueño
  ionViewWillEnter() {
    this.getEncargos();
    if (this.rol == 'Dueño') {
      this.getProductsDueño();
    } else {
      this.getProducts();
    }
  }

  //refrescador usuario
  doRefreshU(event) {
    setTimeout(() => {
      this.getProducts();
      this.getEncargos();
      event.target.complete();
    }, 1000);
  }

  //refrescador dueño
  doRefreshD(event) {
    setTimeout(() => {
      this.getProductsDueño();
      this.getEncargos();
      event.target.complete();
    }, 1000);
  }

  // obtener ganancias
  getProfits() {
    return this.products.reduce(
      (index, product) => index + product.price * product.soldUnits,
      0
    );
  }

  // Obtener productos usuario
  getProducts() {
    this.loading = true;
    this.firebaseSvc.getCol<User>('users').subscribe((users) => {
      if (users) {
        this.usuarios = users;
        this.products = [];
        for (const user of this.usuarios) {
          this.firebaseSvc
            .getCol<Product>(`users/${user.uid}/products`)
            .subscribe((prod) => {
              if (prod) {
                this.products.push(...prod);
              }
            });
        }
        this.loading = false;
      } else {
        console.log('No hay usuarios');
        this.loading = false;
      }
    });
  }

  // Obtener productos
  getEncargos() {
    this.firebaseSvc.getCol<Encargo>(`encargos`).subscribe((encargo) => {
      if (encargo) {
        this.encargos = [];
        if (this.rol == 'Usuario') {
          for (const R of encargo) {
            if (R.idC == this.user().uid) {
              this.encargos.push(R);
            }
          }
        } else {
          this.encargos.push(...encargo);
        }
      }
    });
  }

  // Obtener productos dueño
  getProductsDueño() {
    let path = `users/${this.user().uid}/products`;
    this.loading = true;
    let query = [orderBy('soldUnits', 'desc')];
    let sub = this.firebaseSvc.getCollectionData(path, query).subscribe({
      next: (res: any) => {
        console.log(res);
        this.products = res;
        this.loading = false;
        sub.unsubscribe();
      },
    });
  }

  //agregar o actualizar productos
  async addUpdateProduct(product?: Product) {
    let success = await this.utilsSvc.presentModal({
      component: AddUpdateProductComponent,
      cssClass: 'add-update-modal',
      componentProps: { product },
    });
    if (success) this.ionViewWillEnter(); //actualiza mejor asi en ves de llamar getProducts
  }

  // confimar la eliminacion del producto
  async confirmDeleteProduct(product: Product) {
    this.utilsSvc.presentAlert({
      header: 'Eliminar Producto',
      message: '¿Quieres eliminar este producto?',
      mode: 'ios',
      buttons: [
        {
          text: 'Cancelar',
        },
        {
          text: 'Confirmar',
          handler: () => {
            this.deleteProduct(product);
          },
        },
      ],
    });
  }

  //eliminar producto
  async deleteProduct(product: Product) {
    let path = `users/${this.user().uid}/products/${product.id}`;
    const loading = await this.utilsSvc.loading();
    await loading.present();
    let imagePath = await this.firebaseSvc.getFilePath(product.image);
    await this.firebaseSvc.deleteFile(imagePath);
    this.firebaseSvc
      .deleteDocument(path)
      .then(async (res) => {
        this.products = this.products.filter((p) => p.id !== product.id);
        this.utilsSvc.presentToast({
          message: 'Producto eliminado exitosamente',
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

  openAddUpdateProduct(product?: Product) {
    this.utilsSvc.presentModal({
      component: AddUpdateProductComponent,
      componentProps: { product },
    });
  }

  // Método para calcular el precio con descuento
  getPriceWithDiscount(producto: Product): number {
    if (producto.discount && producto.discount > 0) {
      const discountedPrice = producto.price * (1 - producto.discount / 100);
      return discountedPrice;
    } else {
      return producto.price;
    }
  }

  //------------------------------PAGO--------------------------

  selectedPaymentMethod: string = 'efectivo';
  showMessage = false;

  realizarPago(modalidad) {
    if (this.selectedPaymentMethod === 'efectivo') {
      // Lógica para pago en efectivo
      console.log('Pago en efectivo registrado.');
      // Aquí podrías implementar más lógica según el pago en efectivo
      this.mostrarMensajeProductoEnCamino(); // Mostrar mensaje de producto en camino
      this.encargarCarrito(modalidad, 'efectivo');
    } else if (this.selectedPaymentMethod === 'tarjeta') {
      // // Lógica para pago con tarjeta (ya implementada)
      console.log('Realizando pago con tarjeta...');
      // const cardNumber = (<HTMLInputElement>(
      //   document.getElementById('cardNumber')
      // )).value;
      // const holderName = (<HTMLInputElement>(
      //   document.getElementById('holderName')
      // )).value;
      // const expiry = (<HTMLInputElement>document.getElementById('expiry'))
      //   .value;
      // const cvv = (<HTMLInputElement>document.getElementById('cvv')).value;

      // if (
      //   cardNumber.trim() === '' ||
      //   holderName.trim() === '' ||
      //   expiry.trim() === '' ||
      //   cvv.trim() === ''
      // ) {
      //   console.error('Faltan datos de la tarjeta.');
      //   alert('Por favor completa todos los campos de la tarjeta.');
      //   return;
      // }

      // console.log(
      //   `Pago realizado con tarjeta. Número: ${cardNumber}, Titular: ${holderName}, Expiry: ${expiry}, CVV: ${cvv}`
      // );
      this.mostrarMensajeProductoEnCamino();
      this.encargarCarrito(modalidad, 'Tarjeta');
    }
  }

  mostrarMensajeProductoEnCamino() {
    // Muestra el mensaje de "Producto en camino"
    this.showMessage = true;

    // Simula un tiempo de espera antes de ocultar el mensaje (por ejemplo, 3 segundos)
    setTimeout(() => {
      this.showMessage = false;
    }, 3000); // Oculta el mensaje después de 3 segundos (ajustar según necesidad)
  }

  // ----------- encargo -------------
  public alertButtons = [
    {
      text: 'Si',
      cssClass: 'alert-button-confirm',
      handler: () => {
        this.realizarPago('entrega');
      },
    },
    {
      text: 'No',
      cssClass: 'alert-button-confirm',
      handler: () => {
        this.realizarPago('presencial');
      },
    },
    {
      text: 'Cancelar',
      cssClass: 'alert-button-cancel',
    },
  ];

  async encargarCarrito(modalidad, metodoPago) {
    let path = `encargos`;
    this.data.estado = 'pendiente';
    this.data.idC = this.usuario.uid;
    this.data.productos = this.carritoSvc.getCarritoSimplificado();
    this.data.totalPagar = this.carritoSvc.getTotal();
    this.data.modalidad = modalidad;
    this.data.metodoPago = metodoPago;
    console.log('datos encargo: ' + this.data);
    let docRef = await this.firebaseSvc.addDocument(path, this.data);
    let productId = docRef.id;
    await this.firebaseSvc.updateDocument(`${path}/${productId}`, {
      idE: productId,
    });
    this.carritoSvc.vaciarCarrito();
  }
}
