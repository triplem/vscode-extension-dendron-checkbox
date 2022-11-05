import * as vscode from 'vscode';
import * as helpers from '../helpers';
import { toggleCheckbox } from '../toggleCheckbox';

export const markCheckboxCommand = vscode.commands.registerCommand(
  'markdown-checkbox.markCheckbox',
  (checkmark: string = helpers.getConfig<string>('checkmark')) => {
    if (!helpers.shouldActivate()) {
      return;
    }

    try {
      toggleCheckbox(checkmark);
    } catch (error) {
      console.log(error);
    }
  }
);
