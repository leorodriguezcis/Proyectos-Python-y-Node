/* eslint-disable @typescript-eslint/no-unused-vars */
import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { v4 } from 'uuid';
import { firstValueFrom } from 'rxjs';
import { ConfidentialClientApplication } from '@azure/msal-node';

const scopes = {
  MANAGMENT: 'https://management.azure.com/.default',
  GRAPH: 'https://graph.microsoft.com/.default',
  BOT: 'https://dev.botframework.com/.default',
};
@Injectable()
export class BotBuilderAzure {
  constructor(private readonly httpService: HttpService) {}

  async createBotAzure(
    appId: string,
    appPassword: string,
    tenant: string,
    botName: string,
    botResourceGroup: string,
    endpoint: string,
    avatar: string,
    subscriptionId: string,
    sku: 'F0' | 'S1' = 'F0',
    appType: string = 'MultiTenant',
  ) {
    const uuidbot = v4();
    const tokenManagment = await this.loginAzure2(appId, appPassword, tenant, scopes.MANAGMENT);
    await this.createBotService(
      uuidbot,
      botName,
      endpoint,
      appId,
      botResourceGroup,
      appType,
      sku,
      tokenManagment,
      subscriptionId,
    );
    console.log('Created bot service');
    if (avatar)
      await this.uploadImage(
        uuidbot,
        botResourceGroup,
        avatar,
        subscriptionId,
        appId,
        appPassword,
        tenant,
        tokenManagment,
      );
    await this.addchannelTeams(botResourceGroup, uuidbot, tokenManagment, subscriptionId);
    console.log('Connected channel microsoft teams');
    return { appId, appPassword, botResourceGroup, tenant, botServiceApp: uuidbot, subscriptionId };
  }

  async loginAzure2(appId: string, appPassword: string, tenant: string, scope: string) {
    const msalConfig = {
      auth: {
        clientId: appId,
        authority: `https://login.microsoftonline.com/${tenant}`,
        clientSecret: appPassword,
      },
    };
    const request = {
      scopes: [scope],
    };
    const cca = new ConfidentialClientApplication(msalConfig);
    const response = await cca.acquireTokenByClientCredential(request);
    return response.accessToken;
  }

  async uploadImage(
    appName: string,
    resource: string,
    avatar: string,
    subscription: string,
    appId?: string,
    appPassword?: string,
    tenant?: string,
    token?: string,
  ) {
    const accessToken = token
      ? token
      : await this.loginAzure2(appId, appPassword, tenant, scopes.MANAGMENT);
    const headers = {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json; charset=utf-8',
    };
    const properties = {
      iconUrl: `data:image/png;base64,${avatar}`,
    };
    try {
      const response = await firstValueFrom(
        this.httpService.patch(
          `https://management.azure.com/subscriptions/${subscription}/resourceGroups/${resource}/providers/Microsoft.BotService/botServices/${appName}?api-version=2017-12-01`,
          {
            properties,
          },
          { headers: headers },
        ),
      );
      return response;
    } catch (error) {
      console.log(error);
    }
  }

  async getDataBot(appName: string, appId: string, appPassword: string, tenant: string) {
    const accessToken = await this.loginAzure2(appId, appPassword, tenant, scopes.BOT);
    console.log(accessToken);
    const response = await firstValueFrom(
      this.httpService.get(`https://dev.botframework.com/api/botmanager/bots?id=${appName}`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }),
    );
    return response;
  }

  async createBotService(
    botName: string,
    displayName: string,
    endpoint: string,
    appId: string,
    resourceGroup: string,
    appType: string,
    sku: string,
    token: string,
    subscription: string,
  ) {
    const headers = {
      Authorization: `Bearer ${token}`,
    };
    const response = await firstValueFrom(
      this.httpService.put(
        `https://management.azure.com/subscriptions/${subscription}/resourceGroups/${resourceGroup}/providers/Microsoft.BotService/botServices/${botName}?api-version=2021-05-01-preview`,
        {
          location: 'global',
          sku: {
            name: sku,
          },
          kind: 'azurebot',
          properties: {
            displayName: displayName,
            endpoint: endpoint,
            msaAppType: appType,
            msaAppId: appId,
            isCmekEnabled: false,
            publicNetworkAccess: 'Enabled',
            isStreamingSupported: false,
          },
        },
        { headers: headers },
      ),
    );
    return response;
  }

  async updateDisplayNameBotService(
    resourceGroup: string,
    botAz: string,
    appId: string,
    displayName: string,
    appPassword: string,
    tenant: string,
    subscriptionId: string,
  ) {
    const accessToken = await this.loginAzure2(appId, appPassword, tenant, scopes.MANAGMENT);
    const headers = {
      Authorization: `Bearer ${accessToken}`,
    };
    const response = await firstValueFrom(
      this.httpService.put(
        `https://management.azure.com/subscriptions/${subscriptionId}/resourceGroups/${resourceGroup}/providers/Microsoft.BotService/botServices/${botAz}?api-version=2021-05-01-preview`,
        {
          location: 'global',
          kind: 'azurebot',

          properties: {
            displayName: displayName,
            msaAppId: appId,
          },
        },
        { headers: headers },
      ),
    );
    return response;
  }

  async deleteBotService(
    resourceGroup: string,
    botAz: string,
    appId: string,
    tenant: string,
    appPassword: string,
    subscriptionId: string,
  ) {
    const accessToken = await this.loginAzure2(appId, appPassword, tenant, scopes.MANAGMENT);
    const headers = {
      Authorization: `Bearer ${accessToken}`,
    };
    const response = await firstValueFrom(
      this.httpService.delete(
        `https://management.azure.com/subscriptions/${subscriptionId}/resourceGroups/${resourceGroup}/providers/Microsoft.BotService/botServices/${botAz}?api-version=2021-05-01-preview`,
        { headers: headers },
      ),
    );
    return response;
  }

  async addchannelTeams(resourceGroup: string, botAz: string, token: string, subscription: string) {
    const headers = {
      Authorization: `Bearer ${token}`,
    };
    const response = await firstValueFrom(
      this.httpService.put(
        `https://management.azure.com/subscriptions/${subscription}/resourceGroups/${resourceGroup}/providers/Microsoft.BotService/botServices/${botAz}/channels/MsTeamsChannel?api-version=2021-05-01-preview`,
        {
          location: 'global',
          properties: {
            channelName: 'MsTeamsChannel',
            location: 'global',
            properties: { isEnabled: true },
          },
        },
        { headers: headers },
      ),
    );
    return response;
  }
}
/*az account get-access-token */
