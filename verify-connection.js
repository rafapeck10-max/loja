import { createClient } from "@supabase/supabase-js";

console.log("=== INICIANDO TESTE DE INTEGRAÇÃO SUPABASE LOCAL ===");

// Pegar variáveis do ambiente
const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const key =
  process.env.SUPABASE_PUBLISHABLE_KEY ||
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  process.env.VITE_SUPABASE_ANON_KEY;

console.log("URL do Supabase:", url);
console.log("Chave do Supabase (tamanho):", key ? key.length : 0);

if (!url || !key) {
  console.error(
    "Erro: SUPABASE_URL ou SUPABASE_PUBLISHABLE_KEY não encontrados nas variáveis de ambiente!",
  );
  process.exit(1);
}

// Inicializar cliente
const supabase = createClient(url, key);
console.log("Cliente Supabase inicializado com sucesso.");

async function testDatabase() {
  console.log("\n--- Testando Conexão e Estrutura da Tabela 'produtos' ---");
  try {
    const { data, error } = await supabase
      .from("produtos")
      .select("id, nome, slug, preco_antigo, preco_atual, categoria, url_imagem, ordem")
      .limit(1);

    if (error) {
      console.error("❌ Erro ao consultar a tabela 'produtos':", error.message);
      return false;
    }

    console.log("✅ Tabela 'produtos' consultada com sucesso!");
    console.log("Número de registros encontrados (limite 1):", data.length);
    if (data.length > 0) {
      console.log("Exemplo de produto:", data[0]);
    } else {
      console.log("A tabela está vazia no momento (esperado se não houver produtos adicionados).");
    }
    return true;
  } catch (err) {
    console.error("❌ Erro inesperado no teste de banco de dados:", err);
    return false;
  }
}

async function testStorage() {
  console.log("\n--- Testando Upload no Bucket 'produtos-bucket' ---");
  try {
    // Verificar se o bucket existe e se temos acesso
    console.log("Verificando se o bucket 'produtos-bucket' está visível...");
    const { data: bucketData, error: bucketError } =
      await supabase.storage.getBucket("produtos-bucket");
    if (bucketError) {
      console.warn("⚠️ Aviso ao obter detalhes do bucket:", bucketError.message);
    } else {
      console.log("✅ Bucket encontrado:", bucketData);
    }

    const testFileName = `test_${Date.now()}.png`;
    const testFilePath = `produtos/${testFileName}`;

    // 1x1 transparent PNG buffer
    const testContent = Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=",
      "base64",
    );

    console.log(`Tentando enviar arquivo de teste: ${testFilePath} (1x1 PNG)`);

    // Realizar upload
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("produtos-bucket")
      .upload(testFilePath, testContent, {
        contentType: "image/png",
        upsert: false,
      });

    if (uploadError) {
      console.error("❌ Erro ao fazer upload do arquivo:", uploadError.message);
      return false;
    }

    console.log("✅ Upload concluído com sucesso! Detalhes:", uploadData);

    // Obter URL pública
    const { data: urlData } = supabase.storage.from("produtos-bucket").getPublicUrl(testFilePath);

    console.log("✅ URL Pública obtida:", urlData.publicUrl);

    // Deletar o arquivo de teste para limpeza
    console.log("Limpando arquivo de teste do bucket...");
    const { error: deleteError } = await supabase.storage
      .from("produtos-bucket")
      .remove([testFilePath]);

    if (deleteError) {
      console.warn(
        "⚠️ Aviso: Não foi possível deletar o arquivo de teste após o upload:",
        deleteError.message,
      );
    } else {
      console.log("✅ Limpeza concluída: arquivo de teste removido do bucket.");
    }

    return true;
  } catch (err) {
    console.error("❌ Erro inesperado no teste de Storage:", err);
    return false;
  }
}

async function main() {
  const dbOk = await testDatabase();
  const storageOk = await testStorage();

  console.log("\n=== RESULTADO DO TESTE ===");
  if (dbOk && storageOk) {
    console.log(
      "🎉 SUCESSO! A conexão com o banco de dados e o upload no Bucket estão 100% operacionais!",
    );
    process.exit(0);
  } else {
    console.error("❌ FALHA! Algumas verificações falharam. Verifique os erros acima.");
    process.exit(1);
  }
}

main();
