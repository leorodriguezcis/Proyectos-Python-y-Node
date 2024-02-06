import { MessageFactory, TeamsActivityHandler, TurnContext } from 'botbuilder';

export class MsTeamsBot extends TeamsActivityHandler {
  public memberAddedText: string;

  constructor() {
    super();
    this.onMessage(async (context: TurnContext, next) => {
      await context.sendActivity(MessageFactory.text(context.activity.text));
      await next();
    });
    this.onTeamsMembersAdded = async (context: TurnContext) => {
      const membersAdded = context.activity.membersAdded;
      for (const member of membersAdded) {
        if (member.id !== context.activity.recipient.id) {
          await context.sendActivity(MessageFactory.text(this.memberAddedText));
        }
      }
    };
  }
}
