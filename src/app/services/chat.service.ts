import { Injectable } from '@angular/core';
import { Observable, map, of, switchMap } from 'rxjs';
import { FirebaseService } from './firebase.service';

@Injectable({
  providedIn: 'root'
})
export class ChatService {

  currentUserId: string;
  public users: Observable<any>;
  public chatRooms: Observable<any>;
  public selectedChatRoomMessages: Observable<any>;

  constructor(
    public fireService: FirebaseService
  ) {
    this.getId()
  }

  // obtener id
  getId() {
    this.currentUserId = this.fireService.getId();
  }

  // obtiene usuarios del chat
  getUsers() {
    this.getId();
    this.users = this.fireService.collectionDataQuery(
      'users',
      this.fireService.whereQuery('uid', '!=', this.currentUserId)
    )
  }

  // crear sala de chat
  async createChatRoom(user_id) {
    try {
      let room: any;
      const querySnapshot = await this.fireService.getDocs(
        'chatRooms',
        this.fireService.whereQuery(
          'members',
          'in',
          [[user_id, this.currentUserId], [this.currentUserId, user_id]]
        )
      );
      room = await querySnapshot.docs.map((doc:any) => {
        let item = doc.data();
        item.id = doc.id;
        return item;
      });
      console.log('exist docs: ', room);
      if(room?.length > 0) return room(0);
      const data = {
        members: [
          this.currentUserId,
          user_id
        ],
        type: 'private',
        createdAt: new Date(),
        updateAt: new Date(),
      };
      room = await this.fireService.addDocument('chatRooms', data);
      return room;
    } catch(e) {
      throw(e);
    }
  }

  // obtiene salas de chats
  getChatRooms() {
    this.getId();
    this.chatRooms = this.fireService.collectionDataQuery(
      'chatRooms',
      this.fireService.whereQuery('members', 'array-contains', this.currentUserId)
    ).pipe(
      map((data: any[]) => {
        console.log('room data: ', data);
        data.map((element) => {
          const user_data = element.members.filter(x => x != this.currentUserId);
          console.log(user_data);
          const user = this.fireService.docDataQuery(`users/${user_data[0]}`, true);
          element.user = user;
        });
        return (data);
      }),
      switchMap(data => {
        return of(data)
      })
    )
  }

  // obtiene mensajes sala de chat
  getChatRoomMessages(chatRoomId) {
    this.selectedChatRoomMessages = this.fireService.collectionDataQuery(
      `chats/${chatRoomId}/messages`,
      this.fireService.orderByQuery('createdAt', 'desc')
    )
    .pipe(map((arr: any) => arr.reverse()));
  }

  // envia mensaje
  async sendMessage(chatId, msg) {
    try {
      const new_message = {
        message: msg,
        sender: this.currentUserId,
        createdAt: new Date()
      };
      console.log(chatId);
      if(chatId) {
        await this.fireService.addDocument(`chats/${chatId}/messages`, new_message);
      }
    } catch(e) {
      throw(e);
    }
  }
}
