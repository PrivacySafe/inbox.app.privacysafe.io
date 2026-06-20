export const en = {
  app: {
    title: 'Inbox',
    status: {
      label: 'Status',
      connected: {
        online: 'online',
        offline: 'offline',
      },
    },
    exit: 'Exit',
    select: 'Select',
    ok: 'Ok',
    new: {
      mail: 'New Mail',
    },
  },

  msg: {
    create: {
      dialog: {
        title: 'New Mail',
      },
      label: {
        from: 'From',
        to: 'To',
        subject: 'Subject',
      },
      placeholder: {
        contacts: 'Enter 3NWeb or standard email',
        editor: 'Enter the message text ...',
      },
      btn: {
        attach: 'Attach Files',
        editor_formating: 'Formating',
        discard: 'Discard',
        send: 'Send',
      },
    },
    text: {
      no_selected: {
        part1: 'No email selected.',
        part2: 'Select a message to view its contents.',
      },
    },
    sending: {
      label: {
        canceled: 'Sending canceled',
        error: 'Sending error',
        progress: 'Sending in Progress...',
      },
      error: {
        unknownRecipient: 'unknown recipient',
        msgTooBig: 'this message is bigger than allowed',
        inboxIsFull: 'mailbox of this recipient is full',
        domainNotFound: 'this domain is not found',
        noServiceRecord: 'this domain does not support 3N',
        recipientPubKeyFailsValidation: 'the public key is not valid',
        noDescription: 'No description',
      },
      progress: 'Complete {percent} ({currentValue} of {totalValue})',
    },
    content: {
      preflight_error: 'The message could not be sent to the specified recipients.',
      add_address: 'Add address to the Contacts',
      btn: {
        moveToTrash: 'Move to Trash',
        deleteForever: 'Delete Forever',
        attachments_collapse: 'Collapse',
      },
      tooltip: {
        delete: 'Delete message',
        resend: 'Resend',
        cancel_sending: 'Cancel sending',
        edit: 'Edit',
        send: 'Send',
        download: 'Download the file',
        download_all: 'Download all files',
        view: 'View the file',
        reply: 'Reply',
        replyAll: 'Reply All',
        forward: 'Forward',
        restore: 'Restore',
      },
      editor: {
        fontSize: 'Font size',
        fontSize_header: 'Header',
        fontSize_normal: 'Normal',
        bold: 'Bold',
        unbold: 'Unbold',
        italic: 'Italic',
        noItalic: 'Remove italic',
        underline: 'Underline',
        noUnderline: 'Remove underline',
        strikethrough: 'Strikethrough',
        noStrikethrough: 'Remove strikethrough',
        ordered: 'Ordered list',
        unordered: 'Unordered list',
        noList: 'Remove list',
        decreaseListLevel: 'Decrease list level',
        increaseListLevel: 'Increase list level',
        align_left: 'Align left',
        align_right: 'Align right',
        align_center: 'Align center',
        align_justify: 'Align justify',
        quote: 'Blockquote',
        code: 'Code',
        noCode: 'Remove code',
      },
    },
    actions: {
      select_all: 'Select all',
      deselect_all: 'Deselect all',
      selected: 'Selected',
      cancel: 'Cancel',
      cancel_tooltip: 'Reset marked messages',
    },
    permanent_delete: {
      title: 'Confirm Permanent Deletion',
      string1: 'Are you sure you want to permanently delete selected message(s)?',
      string2: 'This action cannot be undone.',
      confirm_button: 'Delete Completely',
    },
    download: {
      title: 'Select a folder for downloading',
      file_title: 'Save file',
    },
    preflight_dialog: {
      title: 'Preflight processing',
      processing_text: 'Preparing to send... Checking recipient availability. Please wait.',
      subtitle: 'The following address is currently unavailable, and messages cannot be delivered to it:',
      question: 'Would you like to send the message anyway?',
      confirm_button: 'Send Anyway',
    },
    reply_title: 'Original message',
    forward_title: 'Forwarded message',
    attachments: {
      writing: {
        success: 'Attachments have saved',
        error: 'Error writing attachments',
      },
    },
    attachment: {
      writing: {
        success: 'The file {fileName} has saved',
        error: 'Error writing the file {fileName}',
      },
      view_exit: 'Exit viewing',
    },
  },

  folder: {
    empty: {
      title: 'Folder is empty',
      text: {
        inbox:
          'The Inbox folder stores all incoming emails that you have received from 3NWeb services and classic mail services.',
        outbox:
          'The Outbox folder temporarily holds emails that have been sent but are still in the process of being delivered.',
        draft:
          'The Draft folder holds emails you started writing but haven’t sent yet — they’re saved for you to finish and send later.',
        sent: 'The Sent folder contains copies of emails that you have successfully sent to others.',
        trash:
          'The Trash folder temporarily holds deleted emails. Messages stay here until they are permanently removed either manually or after a set period.',
      },
    },
  },
};
