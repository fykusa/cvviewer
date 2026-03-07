import ftp from 'basic-ftp';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Inicializace načítání .env souboru
dotenv.config();

// Aby fungovalo lokální adresování ve složce skriptu při použití ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function deploy() {
    console.log("🚀 Začínám proces nasazení přes FTP...");

    const client = new ftp.Client();
    client.ftp.verbose = true;

    try {
        await client.access({
            host: process.env.FTP_HOST,
            user: process.env.FTP_USER,
            password: process.env.FTP_PASSWORD,
            // secure: true // Odkomentujte, pokud server vyžaduje FTPS
        });

        console.log("✅ Úspěšně připojeno k FTP serveru.");

        const localDir = path.join(__dirname, '../dist');
        const remoteDir = "/www/cvviewer2"; // Změňte podle potřeby, např. "/www" nebo "/public_html"

        console.log(`📂 Nahrávám složku 'dist' do '${remoteDir}'...`);

        await client.ensureDir(remoteDir);
        // Volitelně smazání starých souborů, pro počátek necháme raději bez smazání
        // await client.clearWorkingDir();

        await client.uploadFromDir(localDir);

        console.log("🎉 Deployment úspěšně dokončen!");

    } catch (err) {
        console.error("❌ Při deploymentu nastala chyba:", err);
    } finally {
        client.close();
    }
}

deploy();
