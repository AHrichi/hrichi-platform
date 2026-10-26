import { mergeApplicationConfig } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { FederationHandle, provideRemoteLoader } from '@ah/platform/federation';
import { appConfig } from './app/app.config';
import { App } from './app/app';

export const bootstrap = (federation: FederationHandle | undefined) =>
  bootstrapApplication(
    App,
    mergeApplicationConfig(appConfig, {
      providers: [provideRemoteLoader(federation)],
    }),
  ).catch((err) => console.error(err));
