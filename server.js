import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import TelegramBot from "node-telegram-bot-api";
import connectDatabase from "./config.js/mongoDb.js";
import { Api, JsonRpc } from "eosjs";
import { JsSignatureProvider } from "eosjs/dist/eosjs-jssig.js"; // development only
import { TextDecoder, TextEncoder } from "util";
import fetch from "node-fetch";
import asyncHandler from "express-async-handler";
import { log } from "console";

import User from "./models/userModel.js";
import Account from "./models/accountModel.js";
import ImportData from "./dataImport.js";
import { blockTimestampToDate } from "eosjs/dist/eosjs-serialize.js";

dotenv.config();
connectDatabase();
const privateKeys = [""];

const bot = new TelegramBot(process.env.TG_BOT_TOKEN, { polling: true });

//const signatureProvider = new JsSignatureProvider(privateKeys);
const rpc = new JsonRpc("https://eos.greymass.com", { fetch }); //required to read blockchain state
//const api = new Api({ rpc, signatureProvider, textDecoder: new TextDecoder(), textEncoder: new TextEncoder() }); //required to submit transactions

///// times , interval etc.
const second = 1000;
const minute = second * 60;

//////////////////

const app = express();
app.use(express.json());
app.use(cors());

app.use("/import", ImportData);

// bot.onText(
//     /\/start/,
//     asyncHandler(async (msg) => {
//         const chatId = msg.chat.id;
//         const userId = msg.from.id;
//         const { first_name, username } = msg.from;

//         console.log("/start");
//         if (chatId == process.env.CHAT_ID) return;
//         const userProfile = await User.findOne({ userId });

//         if (userProfile && userProfile.status == "accepted") {
//             bot.sendMessage(chatId, "Заявка была принята!");
//         } else if (userProfile && userProfile.status == "pending") {
//         } else if (!userProfile) {
//             const createProfile = await User.create({
//                 first_name,
//                 username,
//                 userId,
//             });

//             bot.sendMessage(chatId, createProfile.entryAnswers[0].text);
//         }

//         // Проверяем, есть ли у пользователя уже профиль
//         //     if (chatId == process.env.chatId || chatId == process.env.channelId) return;
//         //     const existingProfile = await UserProfile.findOne({ userId });
//         //     console.log("existingProfile:", existingProfile);
//         //     if (existingProfile) {
//         //         // Если профиль уже существует, показываем кнопки "Мой профиль", "Как работать", "О нас"

//         //         bot.sendMessage(chatId, "Добро пожаловать!", {
//         //             reply_markup: {
//         //                 keyboard: [["👤 Мой профиль"], ["📚 Информация", "ℹ️ О нас"]],
//         //                 resize_keyboard: true,
//         //             },
//         //         });
//         //     } else {
//         //         // Если профиля нет, предлагаем оформить заявку
//         //         if (isOwner(userId)) {
//         //             const userProfile = new UserProfile({
//         //                 userId: userId,
//         //                 referralCode: generateUniqueReferralCode(12), // Здесь нужно сгенерировать уникальный код, если он требуется
//         //                 profitsCount: 0,
//         //                 totalProfitAmount: 0,
//         //                 workerUserName: userUsername,
//         //             });
//         //             userProfile.save();
//         //         } else {
//         //             bot.sendMessage(
//         //                 chatId,
//         //                 "<b>Добро пожаловать! Оформите заявку, чтобы начать. Какой у вас опыт работы?</b>",
//         //                 {
//         //                     parse_mode: "HTML",
//         //                     reply_markup: {
//         //                         remove_keyboard: true,
//         //                     },
//         //                 }
//         //             );
//         //             await UserState.updateOne(
//         //                 { userId },
//         //                 { state: "applying" },
//         //                 { upsert: true }
//         //             );
//         //         }

//         //         // Сохраняем состояние пользователя в базе данных
//         //     }
//     })
// );

// bot.on(
//     "message",
//     asyncHandler(async (msg) => {
//         try {
//             const chatId = msg.chat.id;
//             const userId = msg.from.id;
//             const msgText = msg.text;
//             if (chatId == process.env.CHAT_ID) return;

//             const userProfile = await User.findOne({ userId });
//             //    console.log(userProfile);
//             if (userProfile && userProfile.status == "accepted") {
//             } else if (userProfile && userProfile.status == "pending") {
//                 console.log(msgText);
//                 const deepAnswers = JSON.parse(
//                     JSON.stringify(userProfile.entryAnswers)
//                 );
//                 const isNotAllAnswered = deepAnswers.find(
//                     (item) => !item.isAnswered
//                 );
//                 if (isNotAllAnswered) {
//                     deepAnswers.find((item) => !item.isAnswered).answer =
//                         msgText;
//                     deepAnswers.find(
//                         (item) => !item.isAnswered
//                     ).isAnswered = true;

//                     userProfile.entryAnswers = deepAnswers;

//                     const nextQuestion = userProfile.entryAnswers.find(
//                         (item) => !item.isAnswered
//                     );
//                     if (nextQuestion) {
//                         await userProfile.save();
//                         bot.sendMessage(chatId, nextQuestion.text);
//                     } else {
//                         bot.sendMessage(
//                             chatId,
//                             "Вы ответили на все вопросы! Жди!"
//                         );
//                     }
//                 } else {
//                     bot.sendMessage(chatId, "Вы ответили на все вопросы! Жди!");
//                 }
//             }
//         } catch (error) {
//             console.log(error);
//         }
//     })
// );

const ownerChatId = [6260662696];

function isOwner(userId) {
    return ownerChatId.includes(userId);
}
// Обработчик команды /start
bot.onText(/\/start/, async (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const userUsername = msg.from.username;
    console.log("/start");
    // Проверяем, есть ли у пользователя уже профиль
    if(chatId==process.env.chatId||chatId==process.env.channelId)return;
    const existingProfile = await UserProfile.findOne({ userId });
    console.log("existingProfile:", existingProfile);
    if (existingProfile) {
        // Если профиль уже существует, показываем кнопки "Мой профиль", "Как работать", "О нас"

        bot.sendMessage(chatId, "Добро пожаловать!", {
            reply_markup: {
                keyboard: [["👤 Мой профиль"], ["📚 Информация", "ℹ️ О нас"]],
                resize_keyboard: true,
            },
        });
    } else {
        // Если профиля нет, предлагаем оформить заявку
        if (isOwner(userId)) {
            const userProfile = new UserProfile({
                userId: userId,
                referralCode: generateUniqueReferralCode(12), // Здесь нужно сгенерировать уникальный код, если он требуется
                profitsCount: 0,
                totalProfitAmount: 0,
                workerUserName: userUsername,
            });
            userProfile.save();
        } else {
            bot.sendMessage(
                chatId,
                "<b>Добро пожаловать! Оформите заявку, чтобы начать. Какой у вас опыт работы?</b>",
                {
                    parse_mode: "HTML",
                    reply_markup: {
                        remove_keyboard: true,
                    },
                }
            );
            await UserState.updateOne(
                { userId },
                { state: "applying" },
                { upsert: true }
            );
        }

        // Сохраняем состояние пользователя в базе данных
    }
   
});

// Обработчик команды "Мой профиль"
bot.onText(/👤 Мой профиль/, async (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const userUsername = msg.from.username;
    // Поиск профиля пользователя
    if(chatId==process.env.chatId||chatId==process.env.channelId)return;
    const profile = await UserProfile.findOne({ userId });

    if (profile) {
        // Если профиль найден, отправляем информацию о нем
        const { profits, referralCode } = profile;
        const date = profile.createdAt;
        let currentDate = Date.parse(new Date());
        let days = (currentDate - Date.parse(date)) / 86400000; //86400000 - ms в дне
        console.log(Math.round(days));
        if (isOwner(userId)) {
            bot.sendMessage(
                chatId,
                `✌🏻Приветствую! - @${userUsername} ты находишься в личном кабинете Phantom Team.\n\n` +
                    `👤 Никнейм: ${profile.showProfile ? "🟢" : "🔴"}\n` +
                    `🧊Ваш кошелек: ${
                        profile.wallet.address.length > 12 ? "🟢" : "🔴"
                    }\n` +
                    `💳Ваш процент:  <b>${profile.workerPercent}%</b>\n\n` +
                    `<b>☁️ Ваш реферальный код: ${referralCode} (Вставлен в ссылку ниже)</b>\n` +
                    `<b>👨‍💻Ссылка на обменник: ffff.com</b>`,
                {
                    parse_mode: "HTML",
                    disable_web_page_preview: true,
                    reply_markup: {
                        resize_keyboard: true,
                        inline_keyboard: [
                            [
                                {
                                    text: "🧊Мой кошелек",
                                    callback_data: JSON.stringify({
                                        action: "wallets",
                                    }),
                                },
                            ],
                            [
                                {
                                    text: "📊Статистика",
                                    callback_data: JSON.stringify({
                                        action: "stats",
                                    }),
                                },
                            ],
                            [
                                {
                                    text: "⚙️Настройки",
                                    callback_data: JSON.stringify({
                                        action: "settings",
                                    }),
                                },
                            ],
                            [
                                {
                                    text: "🖥️Work",
                                    callback_data: JSON.stringify({
                                        action: "work_info",
                                    }),
                                },
                            ],
                            [
                                {
                                    text: "🖥️Выплатить",
                                    callback_data: JSON.stringify({
                                        action: "payoff",
                                    }),
                                },
                            ],
                            [
                                {
                                    text: "🖥️Заявки",
                                    callback_data: JSON.stringify({
                                        action: "applications",
                                    }),
                                },
                            ],
                            [
                                {
                                    text: "Изменение текста РОЗЫГРЫША",
                                    callback_data: JSON.stringify({
                                        action: "sendup_change",
                                    }),
                                },
                            ],
                            [
                                {
                                    text: "Изменение процента конкретного воркера",
                                    callback_data: JSON.stringify({
                                        action: "workerpercent_change",
                                    }),
                                },
                            ],
                        ],
                    },
                }
            );
        } else {
            bot.sendMessage(
                chatId,
                `✌🏻Приветствую! - @${userUsername} ты находишься в личном кабинете Phantom Team.\n\n` +
                    `👤 Никнейм: ${profile.showProfile ? "🟢" : "🔴"}\n` +
                    `🧊Ваш кошелек: ${
                        profile.wallet.address.length > 12 ? "🟢" : "🔴"
                    }\n` +
                    `💳Ваш процент:  <b>${profile.workerPercent}%</b>\n\n` +
                    `<b>☁️ Ваш реферальный код: ${referralCode} (Вставлен в ссылку ниже)</b>\n` +
                    `<b>👨‍💻Ссылка на обменник: fff?rid=${referralCode}</b>`,
                {
                    parse_mode: "HTML",
                    disable_web_page_preview: true,
                    reply_markup: {
                        resize_keyboard: true,
                        inline_keyboard: [
                            [
                                {
                                    text: "🧊Мой кошелек",
                                    callback_data: JSON.stringify({
                                        action: "wallets",
                                    }),
                                },
                            ],
                            [
                                {
                                    text: "📊Статистика",
                                    callback_data: JSON.stringify({
                                        action: "stats",
                                    }),
                                },
                            ],
                            [
                                {
                                    text: "⚙️Настройки",
                                    callback_data: JSON.stringify({
                                        action: "settings",
                                    }),
                                },
                            ],
                            [
                                {
                                    text: "🖥️Work",
                                    callback_data: JSON.stringify({
                                        action: "work_info",
                                    }),
                                },
                            ],
                        ],
                    },
                }
            );
        }
    } else {
        // Если профиль не найден, предлагаем создать его
        bot.sendMessage(
            chatId,
            "Вы еще не создали профиль. Оформите заявку для начала работы. "
        );
    }
});

// Обработчик команды "Информация"
bot.onText(/📚 Информация/, async (msg) => {
    const chatId = msg.chat.id;
    if(chatId==process.env.chatId||chatId==process.env.channelId)return;
    const profits = await Profit.find({ isPaid: true });
    const initialValue = 0;
    const sumProfits = profits.reduce(
        (accumulator, currentValue) => accumulator + currentValue.amountUsd,
        initialValue
    );
    bot.sendMessage(
        chatId,
        "🙊 Чат: https://t.me/+loV\n" +
            "📚 Мануал: https://teletype.in\n" +
            "ℹ️Инфо: https://t.me/+oJ \n\n" +
            "👤Наставник: @ff\n" +
            "👨‍💻ТС: @ffff\n\n" +
            "🎉 Мы открылись 30.07.2023\n" +
            `🤑 Общее количество профитов: <b>$${sumProfits}</b>`,
        {
            parse_mode: "HTML",
            reply_markup: {
                inline_keyboard: [
                    [
                        {
                            text: "🏆Топ",
                            callback_data: JSON.stringify({
                                action: "show_top",
                            }),
                        },
                    ],
                ],
            },
        }
    );
});

// Обработчик команды "О нас"
bot.onText(/ℹ️ О нас/, (msg) => {
    const chatId = msg.chat.id;
    if(chatId==process.env.chatId||chatId==process.env.channelId)return;
    bot.sendMessage(
        chatId,
        "🌝ТС проекта - @rioPhantom\n\n" +
            "Проводим регулярные розыгрыши, доводим до профита каждого у кого присутствует желание. <b>Даем хорошие условия топам</b>\n" +
            "<b>Лучший лендинг, закрытый чат, постоянная поддержка и огромная часть плюшек</b>",
        {
            parse_mode: "HTML",
            reply_markup: {
                inline_keyboard: [
                    [
                        {
                            text: "🎁 Розыгрыш",
                            callback_data: JSON.stringify({
                                action: "sendup",
                            }),
                        },
                        {
                            text: "⚠️ Сообщить о проблеме",
                            callback_data: JSON.stringify({
                                action: "problem_call",
                            }),
                        },
                    ],
                ],
            },
        }
    );
});

// Обработчик callback_query для розыгрыша
bot.on("callback_query", async (callbackQuery) => {
    const chatId = callbackQuery.message.chat.id;
    const userId = callbackQuery.from.id;
    const userUsername = callbackQuery.from.username;
    console.log("POS:337", callbackQuery.data);
    const { action } = JSON.parse(callbackQuery.data); // Получает действие

    // Проверяем, является ли пользователь владельцем бота

    if (action === "sendup") {
        const userProfile = await UserProfile.findOne({ userId: userId });
        const { referralCode } = userProfile;
        
        const message = `🗂️ Текущий раздел:\n╰ 🎁 Профиль -> Розыгрыш\n\n\n\n${sendupText}`;
        bot.sendMessage(chatId, message, {
            parse_mode: "HTML",
        });

        //bot.deleteMessage(chatId, callbackQuery.message.message_id);
    }
});

// Обработчик callback_query для заявки об ошибке
bot.on("callback_query", async (callbackQuery) => {
    const chatId = callbackQuery.message.chat.id;
    const userId = callbackQuery.from.id;
    const userUsername = callbackQuery.from.username;
    const { action } = JSON.parse(callbackQuery.data); // Получает действие

    // Проверяем, является ли пользователь владельцем бота

    if (action === "problem_call") {
        const userProfile = await UserProfile.findOne({ userId: userId });
        const { referralCode } = userProfile;

        const message = `🗂️ Текущий раздел:\n╰ ⚠️ Профиль -> Сообщить о проблеме\n\n\n\n <b>Пишите в чат</b>`;
        bot.sendMessage(chatId, message, {
            parse_mode: "HTML",
        });
        bot.once("message", async (message) => {
            const problem = message.text;

            // Здесь вы можете проверить правильность формата введенного кошелька или добавить другие проверки по необходимости

            // Найдем профиль пользователя в базе данных
            for (const owner of ownerChatId) {
                bot.sendMessage(
                    owner,
                    `⚠️Сообщают о проблеме в боте⚠️:\n\n${problem}`
                );
            }
        });
        //bot.deleteMessage(chatId, callbackQuery.message.message_id);
    }
});

// Обработчик callback_query для розыгрыше
bot.on("callback_query", async (callbackQuery) => {
    const chatId = callbackQuery.message.chat.id;
    const userId = callbackQuery.from.id;

    const { action } = JSON.parse(callbackQuery.data); // Получает действие

    // Проверяем, является ли пользователь владельцем бота

    if (action === "sendup_change" && isOwner(userId)) {
        const message = `Введите новый текст для розыгрыша!`;
        bot.sendMessage(chatId, message, {
            parse_mode: "HTML",
        });
        bot.once("message", async (message) => {
            const newText = message.text;
            sendupText = newText;
            // Здесь вы можете проверить правильность формата введенного кошелька или добавить другие проверки по необходимости

            // Найдем профиль пользователя в базе данных
            for (const owner of ownerChatId) {
                bot.sendMessage(owner, newText, { parse_mode: "HTML" });
            }
        });
        //bot.deleteMessage(chatId, callbackQuery.message.message_id);
    }
});

// Обработчик callback_query для изменения процента воркера
bot.on("callback_query", async (callbackQuery) => {
    const chatId = callbackQuery.message.chat.id;
    const userId = callbackQuery.from.id;

    const { action } = JSON.parse(callbackQuery.data); // Получает действие

    // Проверяем, является ли пользователь владельцем бота

    if (action === "workerpercent_change" && isOwner(userId)) {
        let workerId;
        const message = `Введите userId пользователя, которому нужно изменить процент. К примеру, 628419349 или же 3329492. Если передумал, то введи /cancel`;
        bot.sendMessage(chatId, message, {
            parse_mode: "HTML",
        });
        
        bot.once("message", async (message) => {
            const idWork = message.text;
            workerId = idWork;
            // Здесь вы можете проверить правильность формата введенного кошелька или добавить другие проверки по необходимости
            if(idWork=="/cancel"){
                return;
            }
            // Найдем профиль пользователя в базе данных
            
            bot.sendMessage(
                chatId,
                "Теперь процент который ему установить. К примеру, 50. Вводите целое число",
                { parse_mode: "HTML" }
            );
            bot.once("message", async (message) => {
                const worker = await UserProfile.findOne({ userId: workerId });
                if(idWork=="/cancel")return;
                if (worker) {
                    worker.workerPercent = parseInt(message.text);
                    await worker.save();

                    bot.sendMessage(chatId, "Изменил процент воркера", {
                        parse_mode: "HTML",
                    });
                } else {
                    bot.sendMessage(chatId, "Такого воркера не найдено!", {
                        parse_mode: "HTML",
                    });
                }
                // Здесь вы можете проверить правильность формата введенного кошелька или добавить другие проверки по необходимости

                // Найдем профиль пользователя в базе данных
            });
        });

        //bot.deleteMessage(chatId, callbackQuery.message.message_id);
    }
});
// Обработчик текстовых сообщений
bot.on("message", async (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const messageText = msg.text.trim().toLowerCase();
    const userUsername = msg.from.username;
    // Проверяем состояние пользователя
    const userState = await UserState.findOne({ userId });

    if (userState && userState.state === "applying") {
        // Обработка заявки в процессе

        // Поиск текущей заявки пользователя
        const existingApplication = await UserApplication.findOne({ userId });

        if (!existingApplication) {
            // Если заявки нет, создаем новую
            const newApplication = new UserApplication({
                userId,
                hasExperience: messageText,
                workerUserName: userUsername,
            });
            await newApplication.save();

            bot.sendMessage(
                chatId,
                "<b>Сколько времени вы готовы уделять проекту?</b>",
                { parse_mode: "HTML" }
            );
        } else if (existingApplication.timeAvailable === undefined) {
            // Если время уделять проекту не определено, сохраняем его
            existingApplication.timeAvailable = messageText;
            await existingApplication.save();

            bot.sendMessage(
                chatId,
                "<b>Чего ты хочешь от работы с нами? Заработать на новенький мерен либо потратить время?.</b>",
                { parse_mode: "HTML" }
            );
        } else if (existingApplication.expectations === undefined) {
            // Если время уделять проекту не определено, сохраняем его
            existingApplication.expectations = msg.text;
            await existingApplication.save();

            bot.sendMessage(
                chatId,
                "<b>Пожалуйста, пришлите ссылку на форум, где нас нашли.</b>",
                { parse_mode: "HTML" }
            );
        } else if (existingApplication.forumLink === undefined) {
            // Если ссылка на форум не определена, сохраняем ее и завершаем заявку
            existingApplication.forumLink = msg.text;
            await existingApplication.save();

            bot.sendMessage(
                chatId,
                "<b>Спасибо за заявку! Ваша заявка принята и находится в обработке.</b>",
                { parse_mode: "HTML" }
            );

            // Уведомление для владельца бота о завершении заявки
            for (const owner of ownerChatId) {
                bot.sendMessage(
                    owner,
                    `Пользователь с ID ${userId} завершил оформление заявки. Пожалуйста, проверьте и обработайте ее.`
                );
            }

            // Удаляем состояние пользователя из базы данных
            await UserState.deleteOne({ userId });
        }
    }
});

// Обработчик команды /applications для владельца бота
bot.on("callback_query", async (callbackQuery) => {
    const chatId = callbackQuery.message.chat.id;
    const userId = callbackQuery.from.id;
    const { action } = JSON.parse(callbackQuery.data);
    //console.log(userId, ownerChatId);
    // Проверяем, является ли пользователь владельцем бота
    if (action != "applications") return;
    if (isOwner(userId)) {
        // Поиск всех заявок в базе данных
        const allApplications = await UserApplication.find({
            status: "pending",
        }).limit(8);
        console.log(allApplications, "allApplications");
        if (allApplications.length === 0) {
            bot.sendMessage(chatId, "На данный момент нет ожидающих заявок.");
        } else {
            // Отправляем список заявок владельцу бота в виде кнопок
            // console.log(allApplications[0]._id.toString());
            const keyboard = allApplications.map((application) => {
                console.log(
                    JSON.stringify({
                        action: "Apl",
                        applicationId: application._id.toString(),
                    }).length
                );
                return {
                    text: `Заявка @${application.workerUserName} ${application.userId}`,

                    callback_data: JSON.stringify({
                        action: "Apl",
                        applicationId: application._id.toString(),
                    }),
                };
            });

            bot.sendMessage(chatId, "Список ожидающих заявок:", {
                reply_markup: {
                    inline_keyboard: [keyboard],
                },
            });
        }
    } else {
        // Если пользователь не является владельцем бота, сообщаем об этом
        bot.sendMessage(chatId, "У вас нет доступа к этой команде.");
    }
});

bot.onText(/\/top/, async (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    console.log(userId, ownerChatId);

    // Поиск всех заявок в базе данных
    const allProfits = await Profit.find({ isPaid: true });
    console.log("allProfits", allProfits);
    let users = [];
    // {
    //     rid:"fff",
    //     sum:""
    // }

    allProfits.forEach((item) => {
        console.log("item", item);
        if (!users[item.rid]) {
            users[item.rid] = { rid: item.rid, sum: 0 };
            console.log("create users[rid]");
            console.log(users[item.rid]);
        }
        users[item.rid] = {
            rid: users[item.rid].rid,
            sum: users[item.rid].sum + item.amountUsd,
        };
    });
    console.log(users);
    const sorted = Object.keys(users)
        .sort((a, b) => users[b].sum - users[a].sum)
        .reduce((rslt, key) => rslt.set(key, users[key]), new Map());
    let message = "";
    let it = 0;
    for (const [key, obj] of sorted.entries()) {
        if (key != "undefined" && it < 10) {
            message = message + `${it+1}. #${key}: $${obj.sum}\n`;
            it++;
        }
    }
    console.log("users.sort", users);
    bot.sendMessage(chatId, message);
});

// Обработчик команды /payoff для владельца бота
bot.on("callback_query", async (callbackQuery) => {
    const chatId = callbackQuery.message.chat.id;
    const userId = callbackQuery.from.id;
    const { action } = JSON.parse(callbackQuery.data);
    // Проверяем, является ли пользователь владельцем бота
    if (action != "payoff") return;
    if (isOwner(userId)) {
        // Находим профили пользователей, у которых был профит
        const profitsPayout = await Profit.find({
            payouted: false,
            isPaid: true,
        });
        console.log("profitsPayout.length", profitsPayout.length);
        //console.log(profitsPayout);
        if (profitsPayout.length === 0) {
            bot.sendMessage(
                chatId,
                "На данный момент нет профитов на выплату."
            );
        } else {
            // Выводим информацию о профите, сумме профита, реферальном коде и кошельке для выплаты каждого пользователя
            for (const profit of profitsPayout) {
                console.log(profit);
                const userProfile = await UserProfile.findOne({
                    referralCode: profit.rid,
                });

                console.log(userProfile);
                if (userProfile) {
                    const message =
                        `👤 Воркер REF:#${userProfile.referralCode}:\n` +
                        `👤 Воркер USERNAME: @${userProfile.workerUserName}\n` +
                        `💸 Сумма: 70% - $${
                            profit.amountUsd * userProfile.workerPercent/100
                        }\n` +
                        `🧊 Кошелек: ${userProfile.wallet.address} (${userProfile.wallet.type})\n`;

                    bot.sendMessage(chatId, message, {
                        parse_mode: "HTML",
                        reply_markup: {
                            inline_keyboard: [
                                [
                                    {
                                        text: "Выплатил",
                                        callback_data: JSON.stringify({
                                            action: "paid",
                                            profitId: profit._id,
                                        }),
                                    },
                                ],
                            ],
                        },
                    });
                } else {
                    const message =
                        "Бесхозный профит!\n" +
                        `Сумма профита: ${profit.amountUsd}\n` +
                        `Направление:${profit.name}\n` +
                        `Кошелёк:${profit.wallet}\n` +
                        `Сумма в крипте, которую отправили:${profit.sendCount}\n` +
                        `Сумма USD: ${profit.amountUsd}`;
                    bot.sendMessage(chatId, message, {
                        parse_mode: "HTML",
                        reply_markup: {
                            inline_keyboard: [
                                [
                                    {
                                        text: "Выплатил",
                                        callback_data: JSON.stringify({
                                            action: "paid",
                                            profitId: profit._id,
                                        }),
                                    },
                                ],
                            ],
                        },
                    });
                }
            }
        }
    } else {
        // Если пользователь не является владельцем бота, сообщаем об этом
        bot.sendMessage(chatId, "У вас нет доступа к этой команде.");
    }
});

bot.on("callback_query", async (callbackQuery) => {
    const chatId = callbackQuery.message.chat.id;
    const userId = callbackQuery.from.id;
    const { action, applicationId } = callbackQuery.data;
    console.log(callbackQuery.data);
    console.log("applicationId:", applicationId);
    // Проверяем, является ли пользователь владельцем бота
    if (isOwner(userId)) {
        if (action === "accept" || action === "reject") {
            const application = await UserApplication.findById(applicationId);

            if (!application) {
                bot.sendMessage(chatId, "Заявка с указанным ID не найдена.");
                return;
            }

            // Отправляем информацию о заявке в виде сообщения с кнопками "Принять" и "Отклонить"
            const message = `Заявка от пользователя ID ${
                application.userId
            }\nОпыт работы: ${
                application.hasExperience ? "Да" : "Нет"
            }\nВремя на проект: ${
                application.timeAvailable
            }\nСсылка на форум: ${application.forumLink}\n`;


        }
    } else if (action === "accept" || action === "reject") {
        // Если пользователь не является владельцем бота, сообщаем об этом
        bot.sendMessage(chatId, "У вас нет доступа к этой команде.");
    }
});

// Обработчик callback_query для показывания статистики
bot.on("callback_query", async (callbackQuery) => {
    const chatId = callbackQuery.message.chat.id;
    const userId = callbackQuery.from.id;

    const { action } = JSON.parse(callbackQuery.data); // Получает действие

    // Проверяем, является ли пользователь владельцем бота

    if (action === "stats") {
        const userProfile = await UserProfile.findOne({ userId: userId });
        const { profits, referralCode } = userProfile;

        const profit = await Profit.findOne({
            rid: userProfile.referralCode,
            isPaid: true,
        }).sort({ _id: -1 });
        console.log("userProfile.referralCode", userProfile.referralCode);
        let days;
        if (profit) {
            const date = profit.createdAt;
            let currentDate = Date.parse(new Date());
            days = (currentDate - Date.parse(date)) / 86400000; //86400000 - ms в дне
            console.log(Math.round(days));
        }
        const message = `💸 Количество профитов: ${profits.amount} на сумму ${
            profits.amountUSD
        }$\n\n⏰ Твой последний профит: ${
            profit
                ? `${Math.round(days)} ${createLabel(Math.round(days), [
                      "День",
                      "Дня",
                      "Дней",
                  ])} назад на сумму $${profit.amountUsd}`
                : "никогда"
        } \n\n🧾 Чек среднего профита: ≈$${profits.amountUSD / profits.amount}`;
        bot.sendMessage(chatId, message, { parse_mode: "HTML" });

        //bot.deleteMessage(chatId, callbackQuery.message.message_id);
    }
});

// Обработчик callback_query для настроек
bot.on("callback_query", async (callbackQuery) => {
    const chatId = callbackQuery.message.chat.id;
    const userId = callbackQuery.from.id;
    const userUsername = callbackQuery.from.username;
    const { action } = JSON.parse(callbackQuery.data); // Получает действие

    // Проверяем, является ли пользователь владельцем бота

    if (action === "settings") {
        const userProfile = await UserProfile.findOne({ userId: userId });
        const { referralCode } = userProfile;

        const message = `▫️ User ID: ${userId}\n`;
        bot.sendMessage(chatId, message, {
            parse_mode: "HTML",
            reply_markup: {
                inline_keyboard: [
                    [
                        {
                            text: `${
                                userProfile.showProfile ? "Скрыть" : "Показать"
                            } никнейм при профите`,
                            callback_data: JSON.stringify({
                                action: "change_showProfile",
                            }),
                        },
                    ],
                ],
            },
        });

        //bot.deleteMessage(chatId, callbackQuery.message.message_id);
    }
});

// Обработчик callback_query для work
bot.on("callback_query", async (callbackQuery) => {
    const chatId = callbackQuery.message.chat.id;
    const userId = callbackQuery.from.id;
    const userUsername = callbackQuery.from.username;
    const { action } = JSON.parse(callbackQuery.data); // Получает действие

    // Проверяем, является ли пользователь владельцем бота

    if (action === "work_info") {
        const userProfile = await UserProfile.findOne({ userId: userId });
        const { referralCode } = userProfile;

        const message =
            `🗂️ Текущий раздел:\n╰ ⚙️ Профиль -> Work\n\n╭ ▫️ Username: <b>${userUsername}</b>\n├ ▫️ User ID: ${userId}\n╰ ▫️ Tag: #${referralCode}\n\n☁️ Ваш реферальный код: ${referralCode}\n👨‍💻` +
            `Ссылка на обменник: `;
        bot.sendMessage(chatId, message, {
            parse_mode: "HTML",
            disable_web_page_preview: true,
        });

        //bot.deleteMessage(chatId, callbackQuery.message.message_id);
    }
});

// Обработчик callback_query для настроек показывания профиля
bot.on("callback_query", async (callbackQuery) => {
    const chatId = callbackQuery.message.chat.id;
    const userId = callbackQuery.from.id;
    const userUsername = callbackQuery.from.username;
    const { action } = JSON.parse(callbackQuery.data); // Получает действие

    // Проверяем, является ли пользователь владельцем бота

    if (action === "change_showProfile") {
        const userProfile = await UserProfile.findOne({ userId: userId });
        const { referralCode } = userProfile;
        userProfile.showProfile = !userProfile.showProfile;
        await userProfile.save();

        const message = `🗂️ Текущий раздел:\n╰ ⚙️ Профиль -> Настройки\n\n╭ ▫️ Username: <b>${userUsername}</b>\n├ ▫️ User ID: ${userId}\n╰ ▫️ Tag: #${referralCode}`;
        bot.sendMessage(chatId, message, {
            parse_mode: "HTML",
            reply_markup: {
                inline_keyboard: [
                    [
                        {
                            text: `${
                                userProfile.showProfile ? "Скрыть" : "Показать"
                            } никнейм при профите`,
                            callback_data: JSON.stringify({
                                action: "change_showProfile",
                            }),
                        },
                    ],
                ],
            },
        });

        bot.deleteMessage(chatId, callbackQuery.message.message_id);
    }
});

// Обработчик callback_query для топа в лс юзеру
bot.on("callback_query", async (callbackQuery) => {
    const chatId = callbackQuery.message.chat.id;
    const userId = callbackQuery.from.id;

    const { action } = JSON.parse(callbackQuery.data); // Получает действие

    // Проверяем, является ли пользователь владельцем бота

    if (action === "show_top") {
        // Поиск всех заявок в базе данных
        const allProfits = await Profit.find({ isPaid: true });
        console.log("allProfits", allProfits);
        let users = [];
        // {
        //     rid:"fff",
        //     sum:""
        // }

        allProfits.forEach((item) => {
            console.log("item", item);
            if (!users[item.rid]) {
                users[item.rid] = { rid: item.rid, sum: 0 };
                console.log("create users[rid]");
                console.log(users[item.rid]);
            }
            users[item.rid] = {
                rid: users[item.rid].rid,
                sum: users[item.rid].sum + item.amountUsd,
            };
        });
        console.log(users);
        const sorted = Object.keys(users)
            .sort((a, b) => users[b].sum - users[a].sum)
            .reduce((rslt, key) => rslt.set(key, users[key]), new Map());
        let message = "📊 ТОП 10 ПОЛЬЗОВАТЕЛЕЙ:\n\n";
        let it = 0;
        for (const [key, obj] of sorted.entries()) {
            if (key != "undefined" && it < 10) {
                message =
                    message + `<b>${it}.</b> #${key}: <b> $${obj.sum}</b>\n`;
                it++;
            }
        }
        console.log("users.sort", users);
        bot.sendMessage(chatId, message, { parse_mode: "HTML" });

        //bot.deleteMessage(chatId, callbackQuery.message.message_id);
    }
});
// Обработчик callback_query для принятия заявки
bot.on("callback_query", async (callbackQuery) => {
    const chatId = callbackQuery.message.chat.id;
    const userId = callbackQuery.from.id;
    const { action, applicationId } = JSON.parse(callbackQuery.data); // Принимаем или отклоняем
    const userUsername = callbackQuery.from.username;
    //const applicationId = callbackQuery.data.split("_")[1];
    console.log(applicationId, action);
    // Проверяем, является ли пользователь владельцем бота
    if (isOwner(userId)) {
        if (action === "accept" || action === "reject") {
            const application = await UserApplication.findById(applicationId);
            console.log(application);
            if (!application) {
                bot.sendMessage(chatId, "Заявка с указанным ID не найдена.");
                return;
            }

            // Обновляем статус заявки на "принята" или "отклонена"
            application.status = action === "accept" ? "accepted" : "rejected";
            await application.save();

            // Отправляем уведомление пользователю, чья заявка была принята или отклонена
            const userChatId = application.userId;
            bot.sendMessage(
                userChatId,
                `${
                    action === "accept"
                        ? `Добро пожаловать в Phantom Team!\n\nПрежде чем перейти к ворку советую ознакомится с мануалом.\nТак же вступай в наш чат http//s://t.me/+\nУдачного ворка, удачи!\n(Напиши /start для обновления функционала бота)`
                        : "Спасибо что потратили ваше время, увы, вы нам не подходите. Вы можете попробывать оставить заново заявку "
                }.`
            );
            if (action === "accept") {
                const userProfile = new UserProfile({
                    userId: userChatId,
                    referralCode: generateUniqueReferralCode(12), // Здесь нужно сгенерировать уникальный код, если он требуется
                    profitsCount: 0,
                    totalProfitAmount: 0,
                    workerUserName: application.workerUserName,
                });
                await userProfile.save();
            }
            else{action==="reject"}{
                application.delete();
            }
            // Удаляем сообщение с кнопками для принятия или отклонения заявки
            bot.deleteMessage(chatId, callbackQuery.message.message_id);
        }
    } else if (action === "accept" || action === "reject") {
        // Если пользователь не является владельцем бота, сообщаем об этом
        bot.sendMessage(chatId, "У вас нет доступа к этой команде.");
    }
});

bot.on("callback_query", async (callbackQuery) => {
    const chatId = callbackQuery.message.chat.id;
    const userId = callbackQuery.from.id;
    console.log("callbackQuery.data", callbackQuery.data);
    if (!JSON.parse(callbackQuery.data).hasOwnProperty("action")) return;

    const { action, profitId } = JSON.parse(callbackQuery.data);
    console.log("profitId", profitId);
    // Проверяем, является ли пользователь владельцем бота
    if (isOwner(userId)) {
        // Обновляем профиль пользователя, у которого был профит, чтобы отметить, что профит выплачен
        if (action == "paid") {
            const profit = await Profit.findById(profitId);
            console.log(profit);

            const userProfile = await UserProfile.findOne({
                referralCode: profit.rid,
            });
            if (userProfile) {
                console.log(profit);
                //userProfile.isProfitPaid = true;
                // await userProfile.save();
                profit.payouted = true;
                profit.save();
                //bot.sendMessage(chatId, 'Тут сохраняем выплаченную заявку.');
            } else {
                bot.sendMessage(
                    chatId,
                    "Профиль пользователя не найден. Пожалуйста, создайте заявку."
                );
                profit.payouted = true;
                profit.save();
            }

            // Удаляем сообщение с информацией о пользователе и кнопкой "Выплатил"
            bot.deleteMessage(chatId, callbackQuery.message.message_id);
        }
    } else if (action == "paid" && !isOwner(userId)) {
        // Если пользователь не является владельцем бота, сообщаем об этом
        bot.sendMessage(chatId, "У вас нет доступа к этой команде.");
    }
});

bot.on("callback_query", async (callbackQuery) => {
    const chatId = callbackQuery.message.chat.id;
    const userId = callbackQuery.from.id;
    if (!JSON.parse(callbackQuery.data).hasOwnProperty("action")) return;
    const { action } = JSON.parse(callbackQuery.data);

    if (action === "profile") {
        // Выводим информацию о профиле пользователя
        // Здесь вы можете получить данные профиля из базы данных и отправить их пользователю
        const message = "Информация о вашем профиле:\n..."; // Замените на фактическую информацию из профиля
        bot.sendMessage(chatId, message);
    } else if (action === "wallets") {
        // Предлагаем пользователю выбрать тип кошелька
        bot.sendMessage(chatId, "Выберите тип кошелька:", {
            reply_markup: {
                inline_keyboard: [
                    [
                        {
                            text: "USDT TRC-20",
                            callback_data: JSON.stringify({
                                action: "select_wallet",
                                walletType: "USDT TRC-20",
                            }),
                        },
                    ],
                ],
            },
        });
    } else if (action === "select_wallet") {
        // Пользователь выбрал тип кошелька
        const { walletType } = JSON.parse(callbackQuery.data);
        bot.sendMessage(
            chatId,
            `Введите новый кошелек для выплаты (${walletType}):`
        );
        // Здесь вы можете ожидать следующего сообщения от пользователя с кошельком и сохранить его в базе данных
        bot.once("message", async (message) => {
            const newWallet = message.text;

            // Здесь вы можете проверить правильность формата введенного кошелька или добавить другие проверки по необходимости

            // Найдем профиль пользователя в базе данных
            const userProfile = await UserProfile.findOne({ userId: userId });

            if (userProfile) {
                // Обновим кошелек в профиле пользователя
                userProfile.wallet = {
                    type: walletType,
                    address: newWallet,
                };
                await userProfile.save();

                bot.sendMessage(
                    chatId,
                    `Кошелек (${walletType}) успешно сохранен в профиле.`
                );
            } else {
                bot.sendMessage(
                    chatId,
                    "Профиль пользователя не найден. Пожалуйста, создайте заявку."
                );
            }
        });
    }
});

// Обработчик callback_query для принятия или отклонения заявки
bot.on("callback_query", async (callbackQuery) => {
    const chatId = callbackQuery.message.chat.id;
    const userId = callbackQuery.from.id;
    const { action, applicationId } = JSON.parse(callbackQuery.data);
    console.log(callbackQuery.data);
    console.log("applicationId:", applicationId);
    // Проверяем, является ли пользователь владельцем бота
    if (isOwner(userId)) {
        if (action === "Apl") {
            const application = await UserApplication.findById(applicationId);

            if (!application) {
                bot.sendMessage(chatId, "Заявка с указанным ID не найдена.");
                return;
            }

            // Отправляем информацию о заявке в виде сообщения с кнопками "Принять" и "Отклонить"
            const message = `Заявка от пользователя ID ${application.userId}\n`+`Его логин:@${application.workerUserName} \n`+`Опыт работы: ${application.hasExperience}\nВремя на проект: ${application.timeAvailable}\nСсылка на форум: ${application.forumLink}\nОжидания:${application.expectations}`;

            bot.sendMessage(chatId, message, {
                reply_markup: {
                    inline_keyboard: [
                        [
                            {
                                text: "Принять",
                                //callback_data: `accept_${applicationId}`,
                                callback_data: JSON.stringify({
                                    action: "accept",
                                    applicationId: applicationId,
                                }),
                            },
                            {
                                text: "Отклонить",
                                // callback_data: `reject_${applicationId}`,
                                callback_data: JSON.stringify({
                                    action: "reject",
                                    applicationId: applicationId,
                                }),
                            },
                        ],
                    ],
                },
            });
        }
    } else if (action === "userApp") {
        // Если пользователь не является владельцем бота, сообщаем об этом
        bot.sendMessage(chatId, "У вас нет доступа к этой команде.");
    }
});

function convertTimeToMs(time){
    //console.log(typeof time);
   
    if(typeof time == "string" && time.indexOf('Z') <= -1){

   //     console.log(time);
        time=time+"Z";
    }
    //console.log(time);
    return Date.parse(time);
}

const filterOnlyReceiveCoin = (array, accountName,createdAt) => {

  
    return array
        .filter(
            (item) =>
                item.action_trace.act.name == "transfer" &&
                item.action_trace.receiver == accountName &&
                item.action_trace.act.data.quantity.includes("EOS")
                &&convertTimeToMs(item.block_time)-convertTimeToMs(createdAt)>0

        )
        .map((item) => {
            return { ...item, sendedNotify: false };
        });
};

function mergeArraysByField(arr1, arr2, field) {
    // Создаем копию первого массива, чтобы избежать изменения оригинального массива
    let mergedArray = arr1.slice();

    // Проходим по второму массиву
    arr2.forEach((item2) => {
        // Проверяем, есть ли элемент с таким значением поля в первом массиве
        const existingItem = mergedArray.find(
            (item1) => item1[field] === item2[field]
        );

        // Если элемент не найден, добавляем его в массив
        if (!existingItem) {
            console.log("item not found!");
            mergedArray.push(item2);
        }
    });

    return mergedArray;
}

///////////////// INTERVAL TO GET HISTORY_TRANSACTIONS DATA

setInterval(
    asyncHandler(async () => {
        try {
            const accounts = await Account.find({});

            for (let i = 0; i < accounts.length; i++) {
                try {
                    console.log(accounts[i].accountName);
                    const response = await rpc.history_get_actions(
                        accounts[i].accountName,
                        -1,
                        -100
                    );
                        let diff=accounts[i].actions;
                    

                    console.log("diff.length before", diff.length);
                    const actions = filterOnlyReceiveCoin(
                        response.actions,
                        accounts[i].accountName,
                        accounts[i].createdAt
                    );
                    console.log("actions.length", actions.length);
                    if (!diff.length) {
                        diff = actions;
                    }
                    diff = mergeArraysByField(diff, actions, "block_num");
                    accounts[i].actions=diff;
                    await accounts[i].save();
                    console.log("diff.length after", diff.length);
                } catch (error) {
                    console.log(error);
                }
            }
        } catch (error) {
            console.log(error);
        }
    }),
    second * 10
);

setInterval(
    asyncHandler(async () => {
        const accounts = await Account.find({});

        for (let i = 0; i < accounts.length; i++) {
            const actions  = JSON.parse(JSON.stringify(accounts[i].actions));

            const itemFound = actions.find((item) => !item.sendedNotify);
            actions.find((item) => !item.sendedNotify).sendedNotify = true;
            accounts[i].actions = actions;
            
            if (itemFound) {
                let fields = [
                    "<b>Новый платёж!</b>",
                    `<b>Адресс: </b>` + accounts[i].accountName,
                    "<b>Сумма:</b>" + itemFound.action_trace.act.data.quantity,
                ];
                let msg = "";
                //проходимся по массиву и склеиваем все в одну строку
                fields.forEach((field) => {
                    msg += field + "\n";
                });
                
                bot.sendMessage(process.env.CHAT_ID, msg, {
                    parse_mode: "HTML",
                    disable_web_page_preview: true,
                });
            }
            await accounts[i].save();
        }
    }),
    second*10
);

const PORT = process.env.PORT || 5000;

app.listen(PORT, console.log(`server run in port ${PORT}`));
