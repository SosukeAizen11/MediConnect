import 'dotenv/config';
import cloudinary from './src/config/cloudinary.js';

try {
    const result = await cloudinary.api.resources({
        resource_type: 'image',
        type: 'upload',
        max_results: 1,
    });

    console.log('CLOUDINARY AUTH SUCCEEDED');
    console.log(result);
} catch (error) {
    console.error('CLOUDINARY AUTH FAILED');
    console.error('Full error:', error);
    console.error('Error JSON:', JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
}