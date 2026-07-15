      if (message.payload.action === 'blocked' && settings.notifyOnBlock) {
        notify('Request Blocked', `Blocked request to ${message.payload.url}`);
        sendSlackAlert(settings.slackWebhook, `🚨 *Request Blocked*\nBlocked request to \`${message.payload.url}\``);
      }
      if (message.payload.action === 'encrypted' && settings.notifyOnEncrypt) {
        notify('Payload Encrypted', `Encrypted payload for ${message.payload.url}`);
        sendSlackAlert(settings.slackWebhook, `🔐 *Payload Encrypted*\nEncrypted sensitive data for \`${message.payload.url}\`\nFields: ${message.payload.sensitiveFieldsDetected?.join(', ')}`);
      }
