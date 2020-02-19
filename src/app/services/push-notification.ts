import { OneSignal } from '@ionic-native/onesignal/ngx';
import { Request, Response, DeviceInfo, ApiService, HttpRequestType } from '@project-sunbird/sunbird-sdk';
import { Inject, Injectable } from '@angular/core';
import { map, catchError } from 'rxjs/operators';
import { PreferenceKeys } from 'src/config/preference-keys';

@Injectable({
  providedIn: 'root'
})
export class PushNotificationService {
  sessionId = '';
  constructor(
    @Inject('API_SERVICE') private apiService: ApiService,
    @Inject('DEVICE_INFO') private deviceInfo: DeviceInfo,
    private oneSignal: OneSignal
  ) { }

  setupPush() {
    this.oneSignal.startInit('6e98f8cf-67fe-4798-93b9-97955e4858fc', '572777623080');

    this.oneSignal.inFocusDisplaying(this.oneSignal.OSInFocusDisplayOption.None);

    this.oneSignal.handleNotificationReceived().subscribe((data: any) => {
      console.log(data);
      this.openClassAssignment();
    });

    this.oneSignal.handleNotificationOpened().subscribe((data: any) => {

      this.openClassAssignment();
    });

    this.oneSignal.endInit();
  }

  openClassAssignment() {
    const deviceId = this.getDeviceId();
    const name = localStorage.getItem(PreferenceKeys.ProfileAttributes.NAME_ATTRIBUTE);
    const url = localStorage.getItem(PreferenceKeys.ProfileAttributes.URL_ATTRIBUTE);
    (window as any).chathead.showChatHead('', deviceId, this.getOsid(), '',
      'STA2', 'IDE9', this.sessionId, 'class', url, name, () => {
      }, () => {
      });
  }

  openHomeAssignment() {
    const deviceId = this.getDeviceId();
    const name = localStorage.getItem(PreferenceKeys.ProfileAttributes.NAME_ATTRIBUTE);
    const url = localStorage.getItem(PreferenceKeys.ProfileAttributes.URL_ATTRIBUTE);
    (window as any).chathead.showChatHead('', deviceId, this.getOsid(), '',
      'STA2', 'IDE9', this.sessionId, 'home', url, name, () => {
      }, () => {
      });
  }

  sendSessionId(sessionId: string) {
    const request = new Request.Builder()
      .withType(HttpRequestType.POST)
      .withPath('/action/composite/v3/search')
      .withApiToken(true)
      .withBody({
        request: {
          filters: {
            objectType: 'Period',
            sessionId,
            status: []
          },
          limit: 1
        }
      })
      .build();

    return this.apiService.fetch(request).pipe(
      map((r: Response<{
        params: {
          status: 'successful' | 'unsuccessful'
        },
        result: {
          count: number,
          Period: []
        } | undefined,
      }>) => {
        return r.body;
      }),
      map((r) => {
        console.log(r);
        if (r.params.status !== 'successful') {
          throw new Error('UNEXPECTED_RESPONSE');
        }

        return r.result!.count;
      }),
    ).toPromise();
  }

  initiatePushNotification(key: string, value: string) {
    const request = new Request.Builder()
      .withType(HttpRequestType.POST)
      .withPath('/api/teacher/v3/notify/batch')
      .withApiToken(true)
      .withBody({
        request: {
          [key]: value
        }
      })
      .build();

    return this.apiService.fetch(request).pipe(
      map((r: any) => {
        console.log(r);
        return r;
      }),
      catchError((e) => {
        console.log(e);
        throw e;

      })
    ).toPromise();
  }

  assignNotificationTags(sessionId: string) {
    this.oneSignal.sendTag('sessionId', sessionId);
    setTimeout(() => {
      this.initiatePushNotification('sessionId', sessionId);
    }, 5000);
    this.sessionId = sessionId;
  }

  removeNotificationTags() {
    this.oneSignal.sendTag('sessionId', '');
    this.sessionId = '';
  }

  getDeviceId(): string {
    return this.deviceInfo.getDeviceID();
  }

  getOsid() {
    return localStorage.getItem(PreferenceKeys.ProfileAttributes.OSID_ATTRIBUTE);
  }
}
