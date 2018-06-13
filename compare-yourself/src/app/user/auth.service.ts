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

    Auth.confirmSignUp(username, code)
      .then(data => {
        this.authDidFail.next(false);
        this.authIsLoading.next(false);
        this.router.navigate(['/']);
      })
      .catch(error => {
        console.log(error);
        this.authDidFail.next(true);
        this.authIsLoading.next(false);
      });
  }

  signIn(username: string, password: string): void {
    this.authIsLoading.next(true);
    const authData = {
      Username: username,
      Password: password
    };

    Auth.signIn(username, password)
      .then(user => {
        this.authStatusChanged.next(true);
        this.authDidFail.next(false);
        this.authIsLoading.next(false);

        console.log(user);
      })
      .catch(error => {
        console.log(error);
        this.authDidFail.next(true);
        this.authIsLoading.next(false);
      });

    this.authStatusChanged.next(true);
    return;
  }

  logout() {
    Auth.signOut()
      .then(data => console.log(data))
      .catch(error => console.log(error));

    this.authStatusChanged.next(false);
  }

  isAuthenticated(): Observable<boolean> {
    const obs = Observable.create((observer) => {
      Auth.currentAuthenticatedUser()
        .then((user) => 
          Auth.currentSession()
            .then((session) => {
              if (session === null) {
                observer.next(false);
              } else if (session.isValid()) {
                observer.next(true);
              } else {
                observer.next(false);
              }
            }))
        .catch(error => {
          observer.next(false);
        });
    });
    return obs;
  }

  initAuth() {
    this.isAuthenticated().subscribe(
      (auth) => this.authStatusChanged.next(auth)
    );
  }
}
