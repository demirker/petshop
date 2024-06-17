import { Component, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import { User } from 'src/app/models/user.model';
import { FirebaseService } from 'src/app/services/firebase.service';
import { UtilsService } from 'src/app/services/utils.service';

@Component({
  selector: 'app-main',
  templateUrl: './main.page.html',
  styleUrls: ['./main.page.scss'],
})
export class MainPage implements OnInit {

  pages = [
    { title: 'Inicio', url: '/main/home', icon: 'home-outline'},
    { title: 'Perfil', url: '/main/profile', icon: 'person-outline'},
  ]

  router =inject(Router);
  firebaseSvc = inject (FirebaseService);
  utilsSvc = inject(UtilsService);

  currentPath: string = '';

  // rol Usuario o Dueño
  rol: any = this.user().role;

  ngOnInit() {
    this.router.events.subscribe((event: any) =>{
      if(event?.url) this.currentPath = event.url;

    })
  }

  // obtiene usuario del localStorage
  user(): User{
    return this.utilsSvc.getFromLocalStorage('user');
  }

  //cerrar sesion
  signOut(){
    this.firebaseSvc.signOut();
    this.utilsSvc.removeFromLocalStorage('user');
    console.log('usuario deslogeado y borrado del localStorage');
  }

}
