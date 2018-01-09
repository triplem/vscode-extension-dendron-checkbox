import * as vscode from 'vscode';
import Checkbox from './checkbox';
import { Position, TextEditor, TextLine } from 'vscode';

/** returns the current cursor position */
export const getCursorPosition = (): Position => {
    return getEditor().selection.active;
};

/** returns the active editor of vs code */
export const getEditor = (): TextEditor => {
    return vscode.window.activeTextEditor;
};

/** give the information if the line has already a bullet point */
export const lineHasBulletPointAlready = (line: TextLine): any => {
    const fstChar = line.firstNonWhitespaceCharacterIndex;

    switch (line.text[fstChar]) {
        case '*':
        case '+':
        case '-':
            return { pos: fstChar + 2, bullet: true };
        default:
            return { pos: fstChar, bullet: false };
    }
};

/** check if line has a checkbox */
export const lineHasCheckbox = (line: TextLine): Checkbox => {
    const lineText = line.text.toString();
    const cbPosition = lineText.indexOf('[ ]');
    const cbPositionMarked = lineText.search(/\[x\]/gi);

    if (cbPosition > -1) {
        return { checked: false, position: new Position(line.lineNumber, cbPosition) };
    } else if (cbPositionMarked > -1) {
        return { checked: true, position: new Position(line.lineNumber, cbPositionMarked) };
    } else {
        return null;
    }
};

/** returns a list of all checkboxes */
export const getAllCheckboxes = (doc: vscode.TextDocument): Checkbox[] => {
    const editor = getEditor();
    const lineCount = editor.document.lineCount;
    const result = [];
    for (let l = 0; l < lineCount; l++) {
        if (lineHasCheckbox(editor.document.lineAt(l)) !== null) {
            result.push(lineHasCheckbox(editor.document.lineAt(l)));
        }
    }
    return result;
};

/** returns the value of a workspace config property */
export const getConfig = (config: string): any =>
    vscode.workspace.getConfiguration('markdown-checkbox').get(config);