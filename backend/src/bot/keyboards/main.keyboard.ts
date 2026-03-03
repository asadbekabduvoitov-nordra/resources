import { Markup } from 'telegraf';

export const mainKeyboard = Markup.keyboard([
  ['📋 Menu 1', '📊 Menu 2'],
  ['⚙️ Sozlamalar', '❓ Yordam'],
]).resize();

export const mainInlineKeyboard = Markup.inlineKeyboard([
  [
    Markup.button.callback('Option 1', 'option_1'),
    Markup.button.callback('Option 2', 'option_2'),
  ],
  [Markup.button.callback('Back', 'back')],
]);

export const removeKeyboard = Markup.removeKeyboard();
