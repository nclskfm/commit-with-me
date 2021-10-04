import * as vscode from 'vscode';
import {
  commitMessage,
  getGitApi,
  getMostFrequent,
  getUserEvents,
  parseEvents,
} from './app';

export function activate(context: vscode.ExtensionContext) {
  context.subscriptions.push(
    vscode.commands.registerCommand('commit-with-me.add-user', () => {
      vscode.window
        .showInputBox({
          placeHolder: 'Enter the GitHub name of the user you want to add',
        })
        .then((user) => {
          if (!user) {
            return;
          }
          getUserEvents(user)
            .then((raw) => {
              parseEvents(JSON.parse(raw.body), user).then(([user, emails]) => {
                const git = getGitApi();
                if (!git) {
                  return;
                }
                const msg = commitMessage(user, getMostFrequent(emails));
                git.repositories[0].inputBox.value += `\n\n${msg}`;
              });
            })
            .catch(() => {
              vscode.window.showErrorMessage(
                'User not found or GitHub not reachable!'
              );
            });
        });
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('commit-with-me.copy-user', () => {
      vscode.window
        .showInputBox({
          placeHolder:
            'Enter the GitHub name of the user you want to copy to your clipboard',
        })
        .then((user) => {
          if (!user) {
            return;
          }
          getUserEvents(user)
            .then((raw) => {
              parseEvents(JSON.parse(raw.body), user).then(([user, emails]) => {
                const msg = commitMessage(user, getMostFrequent(emails));
                vscode.env.clipboard.writeText(msg);
              });
            })
            .catch(() => {
              vscode.window.showErrorMessage(
                'User not found or GitHub not reachable!'
              );
            });
        });
    })
  );
}
