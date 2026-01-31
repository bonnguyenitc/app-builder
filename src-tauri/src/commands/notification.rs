use serde::Serialize;
use crate::models::project::Project;

#[derive(Serialize)]
struct SlackMessage {
    text: String,
}

#[derive(Serialize)]
struct DiscordMessage {
    content: String,
}

#[derive(Serialize)]
struct TelegramMessage {
    chat_id: String,
    text: String,
}

pub async fn send_all_notifications(project: &Project, message: &str) -> Result<(), String> {
    let notifications = match &project.notifications {
        Some(n) => n,
        None => return Ok(()),
    };

    let client = reqwest::Client::new();

    // 1. Slack
    if let Some(slack_config) = &notifications.slack {
        if slack_config.enabled && !slack_config.webhook_url.is_empty() {
            let payload = SlackMessage {
                text: message.to_string(),
            };
            let _ = client.post(&slack_config.webhook_url)
                .json(&payload)
                .send()
                .await;
        }
    }

    // 2. Discord
    if let Some(discord_config) = &notifications.discord {
        if discord_config.enabled && !discord_config.webhook_url.is_empty() {
            let payload = DiscordMessage {
                content: message.to_string(),
            };
            let _ = client.post(&discord_config.webhook_url)
                .json(&payload)
                .send()
                .await;
        }
    }

    // 3. Telegram
    if let Some(telegram_config) = &notifications.telegram {
        if telegram_config.enabled && !telegram_config.bot_token.is_empty() && !telegram_config.chat_id.is_empty() {
            let url = format!("https://api.telegram.org/bot{}/sendMessage", telegram_config.bot_token);
            let payload = TelegramMessage {
                chat_id: telegram_config.chat_id.clone(),
                text: message.to_string(),
            };
            let _ = client.post(&url)
                .json(&payload)
                .send()
                .await;
        }
    }

    Ok(())
}

#[tauri::command]
pub async fn test_notification(project: Project, provider: String) -> Result<(), String> {
    let msg = format!("🔔 Test notification for *{}* project successful!", project.name);

    let notifications = match &project.notifications {
        Some(n) => n,
        None => return Err("No notifications configured".into()),
    };

    let client = reqwest::Client::new();

    match provider.as_str() {
        "slack" => {
            if let Some(config) = &notifications.slack {
                let payload = SlackMessage { text: msg };
                client.post(&config.webhook_url).json(&payload).send().await
                    .map_err(|e| e.to_string())?;
            } else {
                return Err("Slack not configured".into());
            }
        },
        "discord" => {
            if let Some(config) = &notifications.discord {
                let payload = DiscordMessage { content: msg };
                client.post(&config.webhook_url).json(&payload).send().await
                    .map_err(|e| e.to_string())?;
            } else {
                return Err("Discord not configured".into());
            }
        },
        "telegram" => {
            if let Some(config) = &notifications.telegram {
                let url = format!("https://api.telegram.org/bot{}/sendMessage", config.bot_token);
                let payload = TelegramMessage {
                    chat_id: config.chat_id.clone(),
                    text: msg,
                };
                client.post(&url).json(&payload).send().await
                    .map_err(|e| e.to_string())?;
            } else {
                return Err("Telegram not configured".into());
            }
        },
        _ => return Err("Unknown provider".into()),
    }

    Ok(())
}
