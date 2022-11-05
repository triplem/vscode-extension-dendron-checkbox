import * as vscode from 'vscode';
import { Position, Range, TextEditorEdit } from 'vscode';
import * as helpers from './helpers';
const moment = require('moment');

/** Mark a checkbox as checked or unchecked */
export const toggleCheckbox = async (checkmark: string = helpers.getConfig<string>('checkmark')) => {
  // the position object gives you the line and character where the cursor is
  const editor = helpers.getEditor();
  if (editor.selection.isEmpty) {
    const cursorPosition = helpers.getCursorPosition();
    const line = editor.document.lineAt(cursorPosition.line);
    await toggleCheckboxOfLine(line, checkmark);
    const endLine = editor.document.lineAt(editor.selection.end.line);
    const selectionPosition = new vscode.Position(endLine.lineNumber, 20000);
    helpers.getEditor().selection = new vscode.Selection(
      selectionPosition,
      selectionPosition
    );
  } else {
    const selection = editor.selection;

    // get all line numbers of the selection
    for (let r = selection.start.line; r <= selection.end.line; r++) {
      const line = editor.document.lineAt(r);
      await toggleCheckboxOfLine(line, checkmark);
    }
  }
};

/** mark or unmark the checkbox of a given line in the editor */
export const toggleCheckboxOfLine = (
  line: vscode.TextLine,
  checkmark: string,
  checkIt?: boolean
) => {
  const checkbox = helpers.getCheckboxOfLine(line);

  // no action required
  if (
    !checkbox ||
    (!checkbox.checked && checkIt === false) ||
    (checkbox.checked === true && checkIt === true)
  ) {
    return Promise.resolve(undefined);
  }

  let value = ' ';

  // if the checkbox is not checked or it must be checked
  if (checkIt === true || (checkIt === undefined && !checkbox.checked)) {
    value = checkmark;
  }

  return markField(checkbox.position, value, checkmark);
};

/** Marks the field inside the checkbox with a character */
const markField = (
  checkboxPosition: Position,
  replacement: string,
  checkmark: string
): Thenable<boolean> => {
  const editor = helpers.getEditor();

  return editor.edit((editBuilder: TextEditorEdit) => {
    editBuilder.replace(
      new Range(
        new Position(checkboxPosition.line, checkboxPosition.character + 1),
        new Position(
          checkboxPosition.line,
          checkboxPosition.character +
            (replacement !== ' ' ? 2 : checkmark.length + 1)
        )
      ),
      replacement
    );

    // get settings from config
    const italicWhenCheckedArray = helpers.getConfig<Array<string>>('italicWhenChecked');
    const italicWhenChecked = italicWhenCheckedArray.includes(checkmark);
    const strikeThroughWhenCheckedArray = helpers.getConfig<Array<string>>(
      'strikeThroughWhenChecked'
    );
    const strikeThroughWhenChecked = strikeThroughWhenCheckedArray.includes(checkmark);
    const dateWhenCheckedArray = helpers.getConfig<Array<string>>('dateWhenChecked');
    const dateWhenChecked = dateWhenCheckedArray.includes(checkmark)
    const dateFormat = helpers.getConfig<string>('dateFormat');

    const personWhenCheckedArray = helpers.getConfig<Array<string>>('toPersonWhenChecked');
    const personWhenChecked = personWhenCheckedArray.includes(checkmark);
    const personText = helpers.getConfig<string>('personText');

    const reasonWhenCheckedArray = helpers.getConfig<Array<string>>('reasonWhenChecked');
    const reasonWhenChecked = reasonWhenCheckedArray.includes(checkmark);
    const reasonText = helpers.getConfig<string>('reasonText');

    // get line of the checkbox
    const line = editor.document.lineAt(checkboxPosition.line);
    const lhc = helpers.getCheckboxOfLine(line);
    const lineText = line.text;
    const textWithoutCheckbox = lineText
      .substring(checkboxPosition.character + 4, lineText.length)
      .trim();

    // respect trailing whitespace
    const foundTrailingWhitespace = lineText
      .substring(checkboxPosition.character + 4, lineText.length)
      .match(/[\s\n\r]*$/);
    const whitespace = foundTrailingWhitespace?.join('') || '';

    if (lhc && !lhc.checked && textWithoutCheckbox.length > 0) {
      let newText = textWithoutCheckbox;

      // apply different formats to highlight checked status
      if (italicWhenChecked) {
        newText = `*${newText}*`;
      }
      if (strikeThroughWhenChecked) {
        newText = `~~${newText}~~`;
      }
      if (dateWhenChecked) {
        newText = `${newText} [${moment(new Date()).format(
          dateFormat
        )}]${whitespace}`;
      }
      if (personWhenChecked) {
        newText = `${newText} [${personText}: ]${whitespace}`
      }
      if (reasonWhenChecked) {
        newText = `${newText} [${reasonText}: ]${whitespace}`
      }

      editBuilder.replace(
        new Range(
          new Position(checkboxPosition.line, checkboxPosition.character + 4),
          new Position(checkboxPosition.line, line.text.length)
        ),
        newText
      );
    } else if (lhc && lhc.checked) {
      let newText = textWithoutCheckbox.replace(/~~/g, '').replace(/\*/g, '');
      // remove the date string
      if (dateWhenChecked) {
        newText = newText.replace(/\s+\[[^[]+?\]$/, '') + whitespace;
      }

      editBuilder.replace(
        new Range(
          new Position(checkboxPosition.line, checkboxPosition.character + 4),
          new Position(checkboxPosition.line, line.text.length)
        ),
        newText
      );
    }
  });
};
