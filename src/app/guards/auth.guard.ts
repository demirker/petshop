import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, RouterStateSnapshot, UrlTree } from '@angular/router';
import { Observable } from 'rxjs';
import { FirebaseService } from '../services/firebase.service';
import { UtilsService } from '../services/utils.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {

  constructor(private firebaseSvc: FirebaseService, private utilsSvc: UtilsService) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {

      return new Observable<boolean | UrlTree>((observer) => {
        this.firebaseSvc.getAuth().onAuthStateChanged((authState) => {
          if (authState) {
            observer.next(true);
          } else {
            this.utilsSvc.routerLink('/auth'); // te cambie esto para Redireccionar al usuario no autenticado a la página de inicio de sesión
            observer.next(false);
          }
          observer.complete();
        });
      });
  }
}

