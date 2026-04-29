use rusqlite::{params, Connection};
use serde::{Deserialize, Serialize};
use std::sync::Mutex;

const SEED_DATA: &str = include_str!("../../src/data/seed-data.json");

#[derive(Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
struct Metadata {
    schema_version: u32,
    legal_hanja_version: String,
    notice: String,
}

#[derive(Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
struct HanjaChar {
    char: String,
    hangul: String,
    meaning: String,
    strokes: i32,
    original_strokes: i32,
    element: String,
    legal: bool,
    tone: String,
    tags: Vec<String>,
}

#[derive(Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
struct SyllableEntry {
    hangul: String,
    element: String,
    tone: String,
    gender_bias: String,
    popularity: i32,
    styles: Vec<String>,
}

#[derive(Clone, Serialize, Deserialize)]
struct PopularityEntry {
    name: String,
    gender: String,
    rank: i32,
    count: i32,
}

#[derive(Clone, Serialize, Deserialize)]
struct BadWordEntry {
    pattern: String,
    reason: String,
}

#[derive(Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
struct ScoreWeights {
    saju: i32,
    hanja_meaning: i32,
    numerology: i32,
    yin_yang: i32,
    sound_reference: i32,
    modernity: i32,
    preference: i32,
}

#[derive(Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
struct ScoringRules {
    weights: ScoreWeights,
    auspicious_numbers: Vec<i32>,
    caution_numbers: Vec<i32>,
}

#[derive(Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
struct NameDataset {
    metadata: Metadata,
    hanja: Vec<HanjaChar>,
    syllables: Vec<SyllableEntry>,
    popularity: Vec<PopularityEntry>,
    bad_words: Vec<BadWordEntry>,
    scoring_rules: ScoringRules,
}

struct NameStore {
    connection: Mutex<Connection>,
    seed: NameDataset,
}

impl NameStore {
    fn new() -> Result<Self, String> {
        let seed: NameDataset = serde_json::from_str(SEED_DATA).map_err(|error| error.to_string())?;
        let mut connection = Connection::open_in_memory().map_err(|error| error.to_string())?;
        create_schema(&connection)?;
        seed_database(&mut connection, &seed)?;

        Ok(Self {
            connection: Mutex::new(connection),
            seed,
        })
    }
}

#[tauri::command]
fn load_name_dataset(store: tauri::State<'_, NameStore>) -> Result<NameDataset, String> {
    let connection = store.connection.lock().map_err(|error| error.to_string())?;
    let hanja = load_hanja(&connection)?;
    let syllables = load_syllables(&connection)?;
    let popularity = load_popularity(&connection)?;
    let bad_words = load_bad_words(&connection)?;

    Ok(NameDataset {
        metadata: store.seed.metadata.clone(),
        hanja,
        syllables,
        popularity,
        bad_words,
        scoring_rules: store.seed.scoring_rules.clone(),
    })
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .manage(NameStore::new().expect("failed to initialize SQLite naming data"))
        .invoke_handler(tauri::generate_handler![load_name_dataset])
        .setup(|app| {
            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

fn create_schema(connection: &Connection) -> Result<(), String> {
    connection
        .execute_batch(
            "
            CREATE TABLE hanja (
              char TEXT PRIMARY KEY,
              hangul TEXT NOT NULL,
              meaning TEXT NOT NULL,
              strokes INTEGER NOT NULL,
              original_strokes INTEGER NOT NULL,
              element TEXT NOT NULL,
              legal INTEGER NOT NULL,
              tone TEXT NOT NULL,
              tags TEXT NOT NULL
            );
            CREATE TABLE syllable (
              hangul TEXT PRIMARY KEY,
              element TEXT NOT NULL,
              tone TEXT NOT NULL,
              gender_bias TEXT NOT NULL,
              popularity INTEGER NOT NULL,
              styles TEXT NOT NULL
            );
            CREATE TABLE name_popularity (
              name TEXT NOT NULL,
              gender TEXT NOT NULL,
              rank INTEGER NOT NULL,
              count INTEGER NOT NULL,
              PRIMARY KEY (name, gender)
            );
            CREATE TABLE bad_words (
              pattern TEXT PRIMARY KEY,
              reason TEXT NOT NULL
            );
            CREATE TABLE scoring_rules (
              key TEXT PRIMARY KEY,
              value_json TEXT NOT NULL
            );
            CREATE TABLE calendar_cache (
              cache_key TEXT PRIMARY KEY,
              value_json TEXT NOT NULL,
              updated_at TEXT NOT NULL
            );
            ",
        )
        .map_err(|error| error.to_string())
}

fn seed_database(connection: &mut Connection, seed: &NameDataset) -> Result<(), String> {
    let transaction = connection.transaction().map_err(|error| error.to_string())?;

    for entry in &seed.hanja {
        transaction
            .execute(
                "INSERT INTO hanja VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)",
                params![
                    entry.char,
                    entry.hangul,
                    entry.meaning,
                    entry.strokes,
                    entry.original_strokes,
                    entry.element,
                    if entry.legal { 1 } else { 0 },
                    entry.tone,
                    serde_json::to_string(&entry.tags).map_err(|error| error.to_string())?
                ],
            )
            .map_err(|error| error.to_string())?;
    }

    for entry in &seed.syllables {
        transaction
            .execute(
                "INSERT INTO syllable VALUES (?1, ?2, ?3, ?4, ?5, ?6)",
                params![
                    entry.hangul,
                    entry.element,
                    entry.tone,
                    entry.gender_bias,
                    entry.popularity,
                    serde_json::to_string(&entry.styles).map_err(|error| error.to_string())?
                ],
            )
            .map_err(|error| error.to_string())?;
    }

    for entry in &seed.popularity {
        transaction
            .execute(
                "INSERT INTO name_popularity VALUES (?1, ?2, ?3, ?4)",
                params![entry.name, entry.gender, entry.rank, entry.count],
            )
            .map_err(|error| error.to_string())?;
    }

    for entry in &seed.bad_words {
        transaction
            .execute(
                "INSERT INTO bad_words VALUES (?1, ?2)",
                params![entry.pattern, entry.reason],
            )
            .map_err(|error| error.to_string())?;
    }

    transaction
        .execute(
            "INSERT INTO scoring_rules VALUES (?1, ?2)",
            params![
                "default",
                serde_json::to_string(&seed.scoring_rules).map_err(|error| error.to_string())?
            ],
        )
        .map_err(|error| error.to_string())?;

    transaction.commit().map_err(|error| error.to_string())
}

fn load_hanja(connection: &Connection) -> Result<Vec<HanjaChar>, String> {
    let mut statement = connection
        .prepare(
            "SELECT char, hangul, meaning, strokes, original_strokes, element, legal, tone, tags
             FROM hanja
             ORDER BY hangul, char",
        )
        .map_err(|error| error.to_string())?;

    let rows = statement
        .query_map([], |row| {
            let tags_json: String = row.get(8)?;
            let tags = serde_json::from_str(&tags_json).unwrap_or_default();
            Ok(HanjaChar {
                char: row.get(0)?,
                hangul: row.get(1)?,
                meaning: row.get(2)?,
                strokes: row.get(3)?,
                original_strokes: row.get(4)?,
                element: row.get(5)?,
                legal: row.get::<_, i32>(6)? == 1,
                tone: row.get(7)?,
                tags,
            })
        })
        .map_err(|error| error.to_string())?;

    collect_rows(rows)
}

fn load_syllables(connection: &Connection) -> Result<Vec<SyllableEntry>, String> {
    let mut statement = connection
        .prepare("SELECT hangul, element, tone, gender_bias, popularity, styles FROM syllable ORDER BY popularity DESC")
        .map_err(|error| error.to_string())?;

    let rows = statement
        .query_map([], |row| {
            let styles_json: String = row.get(5)?;
            let styles = serde_json::from_str(&styles_json).unwrap_or_default();
            Ok(SyllableEntry {
                hangul: row.get(0)?,
                element: row.get(1)?,
                tone: row.get(2)?,
                gender_bias: row.get(3)?,
                popularity: row.get(4)?,
                styles,
            })
        })
        .map_err(|error| error.to_string())?;

    collect_rows(rows)
}

fn load_popularity(connection: &Connection) -> Result<Vec<PopularityEntry>, String> {
    let mut statement = connection
        .prepare("SELECT name, gender, rank, count FROM name_popularity ORDER BY rank")
        .map_err(|error| error.to_string())?;

    let rows = statement
        .query_map([], |row| {
            Ok(PopularityEntry {
                name: row.get(0)?,
                gender: row.get(1)?,
                rank: row.get(2)?,
                count: row.get(3)?,
            })
        })
        .map_err(|error| error.to_string())?;

    collect_rows(rows)
}

fn load_bad_words(connection: &Connection) -> Result<Vec<BadWordEntry>, String> {
    let mut statement = connection
        .prepare("SELECT pattern, reason FROM bad_words ORDER BY pattern")
        .map_err(|error| error.to_string())?;

    let rows = statement
        .query_map([], |row| {
            Ok(BadWordEntry {
                pattern: row.get(0)?,
                reason: row.get(1)?,
            })
        })
        .map_err(|error| error.to_string())?;

    collect_rows(rows)
}

fn collect_rows<T, F>(rows: rusqlite::MappedRows<'_, F>) -> Result<Vec<T>, String>
where
    F: FnMut(&rusqlite::Row<'_>) -> rusqlite::Result<T>,
{
    let mut values = Vec::new();
    for row in rows {
        values.push(row.map_err(|error| error.to_string())?);
    }
    Ok(values)
}
