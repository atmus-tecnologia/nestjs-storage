# NestJS Storage

NestJS Storage é um módulo NestJS que fornece uma interface unificada para manipular operações de armazenamento de arquivos em vários provedores, incluindo AWS S3, Google Cloud Storage, Azure Blob Storage e armazenamento local.

## Features

- Upload de arquivos para AWS S3, Google Cloud Storage, Azure Blob Storage ou sistema de arquivos local.
- Download de arquivos desses provedores de armazenamento.
- Exclusão de arquivos desses provedores de armazenamento.
- Visualização de arquivos diretamente no navegador.

## Instalação

Instale a biblioteca e suas dependências:

```bash
npm install @atmus/nestjs-storage
```

## Configuração

Configure as definições do provedor de armazenamento usando variáveis de ambiente. Aqui está um exemplo de arquivo `.env`:

```env
STORAGE_PROVIDER=local

AWS_ACCESS_KEY_ID=your_aws_access_key_id
AWS_SECRET_ACCESS_KEY=your_aws_secret_access_key
AWS_REGION=your_aws_region
AWS_BUCKET=your_aws_bucket

GCP_PROJECT_ID=your_gcp_project_id
GCP_KEY_FILENAME=path_to_your_gcp_keyfile.json
GCP_BUCKET=your_gcp_bucket

AZURE_CONNECTION_STRING=your_azure_connection_string
AZURE_CONTAINER_NAME=your_azure_container_name

LOCAL_STORAGE_DIRECTORY=./uploads
```

## Uso

### Importando o Módulo

Importe o `StorageModule` no módulo raiz da sua aplicação NestJS:

```typescript
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { StorageModule } from '@atmus/nestjs-storage';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    StorageModule,
  ],
})
export class AppModule {}
```

### Usando o Storage Service

Use o `StorageService` em seus controladores ou serviços para manipular operações de arquivos:

```typescript
import { Controller, Post, Get, Delete, Param, UploadedFile, UseInterceptors, Res } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { StorageService } from '@atmus/nestjs-storage';
import { Response } from 'express';

@Controller('files')
export class AppController {
  constructor(private readonly storageService: StorageService) {}

  @Post()
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(@UploadedFile() file: Express.Multer.File) {
    const filePath = await this.storageService.uploadFile(file);
    return { filePath };
  }

  @Get(':fileName/download')
  async downloadFile(@Param('fileName') fileName: string, @Res() res: Response) {
    const fileBuffer = await this.storageService.downloadFile(fileName);
    res.set({
      'Content-Type': 'application/octet-stream',
      'Content-Disposition': `attachment; filename="${fileName}"`,
    });
    res.send(fileBuffer);
  }

  @Get(':fileName')
  async viewFile(@Param('fileName') fileName: string, @Res() res: Response) {
    const fileBuffer = await this.storageService.downloadFile(fileName);
    const mimeType = mime.lookup(fileName) || 'application/octet-stream';
    res.set({
      'Content-Type': mimeType,
      'Content-Disposition': `inline; filename="${fileName}"`,
    });
    res.send(fileBuffer);
  }

  @Delete(':fileName')
  async deleteFile(@Param('fileName') fileName: string) {
    await this.storageService.deleteFile(fileName);
    return { message: 'File deleted successfully' };
  }
}
```

## Provedores de Armazenamento

### AWS S3

Certifique-se de ter as seguintes variáveis de ambiente configuradas:

```env
STORAGE_PROVIDER=aws
AWS_ACCESS_KEY_ID=your_aws_access_key_id
AWS_SECRET_ACCESS_KEY=your_aws_secret_access_key
AWS_REGION=your_aws_region
AWS_BUCKET=your_aws_bucket
```

### Google Cloud Storage

Certifique-se de ter as seguintes variáveis de ambiente configuradas:

```env
STORAGE_PROVIDER=gcp
GCP_PROJECT_ID=your_gcp_project_id
GCP_KEY_FILENAME=path_to_your_gcp_keyfile.json
GCP_BUCKET=your_gcp_bucket
```

### Azure Blob Storage

Certifique-se de ter as seguintes variáveis de ambiente configuradas:

```env
STORAGE_PROVIDER=azure
AZURE_CONNECTION_STRING=your_azure_connection_string
AZURE_CONTAINER_NAME=your_azure_container_name
```

### Sistema de Arquivos Local

Certifique-se de ter as seguintes variáveis de ambiente configuradas:

```env
STORAGE_PROVIDER=local
LOCAL_STORAGE_DIRECTORY=./uploads
```

## Licença

Este projeto está licenciado sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

## Contribuição

Contribuições são bem-vindas! Por favor, abra uma issue ou envie um pull request para quaisquer alterações.

## Autor

Atmus Tecnologia - [atmustecnologia.com.br](https://atmustecnologia.com.br).