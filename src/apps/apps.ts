/*
 Copyright (C) 2018 3NSoft Inc.

 This program is free software: you can redistribute it and/or modify it under
 the terms of the GNU General Public License as published by the Free Software
 Foundation, either version 3 of the License, or (at your option) any later
 version.

 This program is distributed in the hope that it will be useful, but
 WITHOUT ANY WARRANTY; without even the implied warranty of
 MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
 See the GNU General Public License for more details.

 You should have received a copy of the GNU General Public License along with
 this program. If not, see <http://www.gnu.org/licenses/>.
*/
import {
  IAngularStatic,
  IComponentOptions,
  ITimeoutService,
  material,
} from 'angular';
import { StateService, Transition } from '@uirouter/angularjs';
import { Subject } from 'rxjs/Subject';
import { Observable } from 'rxjs/Observable';
import { filter, share, takeUntil, tap } from 'rxjs/operators';
import * as CommonServiceModule from './common/services/common.service';
import { appState } from './common/services/app-store';
import { AppId, APPS } from '../common/const';
import * as MsgReceivingServiceModule from '../apps/app-mail/services/message-receiving.service';
import { appMailState } from './app-mail/common/app-mail-store';

export let ModuleName = '3nClient.apps';
export function addComponent(ng: IAngularStatic): void {
  const mod = ng.module(ModuleName, []);
  mod.component('apps', componentConfig);
}

class AppsComponent {
  public user: string;
  public userStatus: string;
  public isProgress: boolean;
  public menu: client3N.Apps[];

  private ngUnsubscribe: Subject<void> = new Subject<void>();

  static $inject = [
    '$state',
    '$timeout',
    '$transitions',
    '$mdSidenav',
    CommonServiceModule.CommonServiceName,
    MsgReceivingServiceModule.MessageReceivingServiceName,
  ];
  constructor(
    private $state: StateService,
    private $timeout: ITimeoutService,
    private $transitions: Transition,
    private $mdSidenav: material.ISidenavService,
    private commonSrv: CommonServiceModule.CommonService,
    private msgReciveSrv: MsgReceivingServiceModule.MessageReceivingService,
  ) {}

  async $onInit(): Promise<void> {
    this.user = appState.values.user.split('@')[0];
    this.userStatus = appState.values.userStatus.description;
    this.menu = APPS.filter(item => !item.isDisabled && item.stateName);
    this.msgReciveSrv.refreshInbox();

    appState
      .change$
      .user
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe(user => {
        this.user = user.split('@')[0];
        console.log(this.user);
      });

    appState
      .change$
      .userStatus
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe(status => {
        this.userStatus = status.description;
        console.log(this.userStatus);
      });

    appState
      .change$
      .isProgressBarShow
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe(state => {
        this.isProgress = state;
        console.log(this.isProgress);
      });

    this.$mdSidenav('right', true)
      .then(sidenav => {
        sidenav.onClose(() => {
          appState.values.isRightSidenavOpen = false;
        });
      });

    const currentApp = APPS.find(item => item.id === appState.values.currentAppId);
    if (currentApp) {
      this.$state.go(currentApp.stateName);
    } else {
      this.$state.go('root.app-mail');
    }

    this.$transitions.onStart({}, transition => {
      if (transition.from().name !== transition.to().name && this.$mdSidenav('right').isOpen()) {
        this.$mdSidenav('right').close();
      }
    });

    const msgIn$: Observable<client3N.IncomingMessage> = Observable
      .create(obs => w3n.mail.inbox.subscribe('message', obs))
      .pipe(share());

    msgIn$
      .pipe(
        filter(msg => msg.msgType === 'mail'),
        tap(msg => this.msgReciveSrv.refreshInbox()),
        takeUntil(this.ngUnsubscribe),
        share(),
      )
      .subscribe();

    appMailState.change$.unreadMessages
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe(qt => this.setUnreadAmount(AppId.Mail, qt));
  }

  $onDestroy(): void {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }

  public toogleRightSidenav(): void {
    const isRightSidenavOpen = appState.values.isRightSidenavOpen;
    appState.values.isRightSidenavOpen = !isRightSidenavOpen;
    this.$mdSidenav('right').toggle();
  }

  public setUnreadAmount(appId: number, count: number): void {
    this.$timeout(() => {
      const appItem = this.menu.find(item => item.id === appId);
      appItem.unreadAmount = count;
      console.log(this.menu);
    });
  }

}

const componentConfig: IComponentOptions = {
  bindings: {},
  templateUrl: './apps/apps.html',
  controller: AppsComponent,
};
