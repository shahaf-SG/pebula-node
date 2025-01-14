import { TokenCredential } from '@azure/service-bus';
import { DefaultAzureCredential } from '@azure/identity';

// Client

export interface ServiceBusAadTokenCredentials {
  /**
   * Fully qualified domain name for ServiceBus.
   * Most likely, {yournamespace}.servicebus.windows.net
   */
  host: string;
  /**
   * The Token credentials generated by using the * `@azure/identity` library.
   * It can be one of the following:
   *  - EnvironmentCredential
   *  - WorkloadIdentityCredential
   *  - ManagedIdentityCredential
   *  - AzureCliCredential
   *  - AzurePowerShellCredential
   *  - AzureDeveloperCliCredential
   */
  credentials: DefaultAzureCredential;
}

export interface ServiceBusTokenProviderCredentials {
  host: string;
  tokenProvider: TokenCredential;
}

export interface ServiceBusConnectionStringCredentials {
  connectionString: string;
}

export type SbCredentials = ServiceBusAadTokenCredentials | ServiceBusTokenProviderCredentials | ServiceBusConnectionStringCredentials;

// Management

export interface ServiceBusManagementAadTokenCredentials extends ServiceBusAadTokenCredentials {
  resourceGroupName: string;
  namespace: string;
  subscriptionId: string;
}

export type SbManagementCredentials =
  | ServiceBusManagementAadTokenCredentials
  | ServiceBusConnectionStringCredentials;
