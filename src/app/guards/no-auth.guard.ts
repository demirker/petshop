import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, RouterStateSnapshot, UrlTree } from '@angular/router';
import { Observable } from 'rxjs';
import { FirebaseService } from '../services/firebase.service';
import { UtilsService } from '../services/utils.service';
import { map, take } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class NoAuthGuard implements CanActivate {

  constructor(private firebaseSvc: FirebaseService, private utilsSvc: UtilsService) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {

      return new Observable<boolean | UrlTree>((observer) => {
        this.firebaseSvc.getAuth().onAuthStateChanged((authState) => {
          if (!authState) {
            observer.next(true);
          } else {
            this.utilsSvc.routerLink('/main/home'); // Redireccionar al usuario autenticado a la página principal
            observer.next(false);
          }
          observer.complete();
        });
      });
  }
}

