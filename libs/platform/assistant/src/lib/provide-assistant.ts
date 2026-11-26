import type { Provider } from '@angular/core';
import { ASSISTANT_SETUP, type AssistantSetup } from './assistant.model';
import { AssistantService } from './assistant.service';

/**
 * An app's assistant, for a component's (or route's) providers: `setup`
 * runs in an injection context, so executors can inject the app's store,
 * router and the rest.
 */
export function provideAssistant(setup: () => AssistantSetup): Provider[] {
  return [AssistantService, { provide: ASSISTANT_SETUP, useFactory: setup }];
}
