import { ActivityHandler, MessageFactory } from 'botbuilder';

export class GenericChatbot extends ActivityHandler {
  public memberAddedText: string;

  constructor() {
    super();
    this.onMessage(async (context, next) => {
      await context.sendActivity(MessageFactory.text(context.activity.text));
      await next();
    });

    this.onMembersAdded(async (context, next) => {
      const membersAdded = context.activity.membersAdded;
      for (const member of membersAdded) {
        if (member.id !== context.activity.recipient.id) {
          await context.sendActivity(MessageFactory.text(this.memberAddedText));
        }
      }
      await next();
    });
  }
}
