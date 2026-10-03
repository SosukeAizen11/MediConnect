import 'dotenv/config';
import cloudinary from './src/config/cloudinary.js';

const pngBase64 =
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4z8DwHwAFgAI/Scf9WQAAAABJRU5ErkJggg==';

const buffer = Buffer.from(pngBase64, 'base64');

const uploadStream = cloudinary.uploader.upload_stream(
    {
        folder: 'mediconnect/test',
        resource_type: 'image',
    },
    (error, result) => {
        if (error) {
            console.error('CLOUDINARY IMAGE TEST FAILED');
            console.error('message:', error?.message);
            console.error('http_code:', error?.http_code);
            console.error('name:', error?.name);
            console.error('error:', error?.error);
            console.error('full error:', error);
            process.exit(1);
        }

        console.log('CLOUDINARY IMAGE TEST SUCCEEDED');
        console.log({
            public_id: result.public_id,
            secure_url: result.secure_url,
            resource_type: result.resource_type,
            format: result.format,
        });

        process.exit(0);
    }
);

uploadStream.end(buffer);