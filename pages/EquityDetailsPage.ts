import { BasePage } from './BasePage';

export class EquityDetailsPage extends BasePage {
  restrictedMessage = 'text=You are not authorized';

  async isDetailsVisible() {
    return !(await this.isVisible(this.restrictedMessage));
  }

  async getRestrictedMessage() {
    return this.getText(this.restrictedMessage);
  }
}
