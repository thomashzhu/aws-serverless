import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Subject } from 'rxjs/Subject';

import { Observable } from 'rxjs/Observable';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';

import { User } from './user.model';

import Amplify, { Auth } from 'aws-amplify';
import { CognitoUser } from 'amazon-cognito-identity-js';
import aws from 'private/aws';

@Injectable()
export class AuthService {
  authIsLoading = new BehaviorSubject<boolean>(false);
  authDidFail = new BehaviorSubject<boolean>(false);
  authStatusChanged = new Subject<boolean>();
  registeredUser: CognitoUser;

  constructor(private router: Router) {
    Amplify.configure({
      Auth: {
          region: 'us-east-1',
          userPoolId: 'us-east-1_iRxiI3bv8',
          userPoolWebClientId: aws.clientId,
      }
  });
  }

  signUp(username: string, email: string, password: string): void {
    this.authIsLoading.next(true);
    const user: User = {
      username: username,
      email: email,
      password: password
    };
    const emailAttribute = {
      Name: 'email',
      Value: user.email
    };

    Auth.signUp({
      username,
      password,
      attributes: {
          email,
      },
    })
    .then(data => {
      this.authDidFail.next(false);
      this.registeredUser = data.user;
      this.authIsLoading.next(false);
    })
    .catch(error => {
      console.log(error);
      this.authDidFail.next(true);
      this.authIsLoading.next(false);
    });

    return;
  }

  confirmUser(username: string, code: string) {
    this.authIsLoading.next(true);
    const userData = {
      Username: username,
    };
  }

  signIn(username: string, password: string): void {
    this.authIsLoading.next(true);
    const authData = {
      Username: username,
      Password: password
    };
    this.authStatusChanged.next(true);
    return;
  }

  getAuthenticatedUser() {
  }

  logout() {
    this.authStatusChanged.next(false);
  }

  isAuthenticated(): Observable<boolean> {
    const user = this.getAuthenticatedUser();
    const obs = Observable.create((observer) => {
      if (!user) {
        observer.next(false);
      } else {
        observer.next(false);
      }
      observer.complete();
    });
    return obs;
  }

  initAuth() {
    this.isAuthenticated().subscribe(
      (auth) => this.authStatusChanged.next(auth)
    );
  }
}
