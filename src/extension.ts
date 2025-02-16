import * as vscode from "vscode";
import ollama from "ollama";

export function activate(context: vscode.ExtensionContext) {
  console.log('"deepseek-ext" is now active!');

  const disposable = vscode.commands.registerCommand(
    "deepseek-ext.start",
    () => {
      const panel = vscode.window.createWebviewPanel(
        "deeptalk",
        "DeepTalk",
        vscode.ViewColumn.One,
        {
          enableScripts: true,
        }
      );

      panel.webview.html = getWebViewContent();
      panel.webview.onDidReceiveMessage(async (message: any) => {
        if (message.command === "chat") {
          const userPrompt = message.question;
          let responseText = "";

          try {
            const streamResponse = await ollama.chat({
              model: "deepseek-r1:latest",
              messages: [{ role: "user", content: userPrompt }],
              stream: true,
            });

            for await (const part of streamResponse) {
              responseText += part.message.content;
              panel.webview.postMessage({
                command: "chatResponse",
                text: responseText,
              });
            }
          } catch (error) {
            panel.webview.postMessage({
              command: "chatResponse",
              text: `Error: ${String(error)}`,
            });
          }
        }
      });
    }
  );

  context.subscriptions.push(disposable);
}

function getWebViewContent(): string {
  return /*html*/ `<!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8">
    <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
      background-color: #1e1e1e;
      color: #ffffff;
      margin: 0;
      padding: 16px;
      display: flex;
      flex-direction: column;
      align-items: center;
      height: 100vh;
      box-sizing: border-box;
    }

    h2 {
      color: #4CAF50;
      margin-bottom: 20px;
      font-size: 1.5em;
    }

    textarea {
      width: 100%;
      padding: 12px;
      border: 1px solid #4CAF50;
      border-radius: 8px;
      background-color: #2d2d2d;
      color: #ffffff;
      font-size: 14px;
      resize: none;
      margin-bottom: 16px;
      outline: none;
    }

    textarea::placeholder {
      color: #888;
    }

    button {
      background-color: #4CAF50;
      color: white;
      border: none;
      padding: 12px 24px;
      border-radius: 8px;
      font-size: 14px;
      cursor: pointer;
      transition: background-color 0.3s ease;
    }

    button:hover {
      background-color: #45a049;
    }

    #response {
      margin-top: 20px;
      width: 100%;
      padding: 12px;
      background-color: #2d2d2d;
      border-radius: 8px;
      color: #ffffff;
      font-size: 14px;
      line-height: 1.5;
      min-height: 100px;
      white-space: pre-wrap;
    }

    .loader {
      border: 4px solid #2d2d2d;
      border-top: 4px solid #4CAF50;
      border-radius: 50%;
      width: 24px;
      height: 24px;
      animation: spin 1s linear infinite;
      margin: 20px auto;
    }

    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
  </style>
  </head>
  <body>
    <h2>DeepSeek VS Code Extension</h2>
    <textarea id="prompt" rows="3" placeholder="Ask me something..."></textarea><br />
    <button id="askBtn">Ask</button>
    <div id="response"></div>

    <script>
      const vscode = acquireVsCodeApi();

      const prompt = document.getElementById('prompt');
      const askBtn = document.getElementById('askBtn');
      const response = document.getElementById('response');

      askBtn.addEventListener('click', () => {
        const question = prompt.value;
        prompt.value = '';
        response.innerHTML = 'Thinking...';

        vscode.postMessage({ command: 'chat', question });
      });

      window.addEventListener('message', event => {
        const {command, text} = event.data;
        if (command === 'chatResponse') {
          document.getElementById('response').innerHTML = text;
        }
      });
      </script>
  </body>
  </html>`;
}

export function deactivate() {}
