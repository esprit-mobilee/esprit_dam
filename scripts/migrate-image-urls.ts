// Migration script to update all existing image URLs to include /api prefix
// Run this once: node dist/scripts/migrate-image-urls.js

import { MongoClient } from 'mongodb';

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/dam';

async function migrateImageUrls() {
    const client = new MongoClient(MONGO_URI);

    try {
        await client.connect();
        console.log('✅ Connected to MongoDB');

        const db = client.db();

        // 1. Update Internship Offers - logoUrl
        const offersResult = await db.collection('internshipoffers').updateMany(
            {
                $and: [
                    { logoUrl: { $regex: '^/uploads/', $options: 'i' } },
                    { logoUrl: { $not: { $regex: '^/api/uploads/' } } }
                ]
            },
            [
                {
                    $set: {
                        logoUrl: {
                            $concat: ['/api', '$logoUrl']
                        }
                    }
                }
            ]
        );
        console.log(`📋 Updated ${offersResult.modifiedCount} internship offers`);

        // 2. Update Events - imageUrl
        const eventsResult = await db.collection('events').updateMany(
            {
                $and: [
                    { imageUrl: { $regex: '^/uploads/', $options: 'i' } },
                    { imageUrl: { $not: { $regex: '^/api/uploads/' } } }
                ]
            },
            [
                {
                    $set: {
                        imageUrl: {
                            $concat: ['/api', '$imageUrl']
                        }
                    }
                }
            ]
        );
        console.log(`📅 Updated ${eventsResult.modifiedCount} events`);

        // 3. Update Clubs - imageUrl and coverImageUrl
        const clubsImageResult = await db.collection('clubs').updateMany(
            {
                $and: [
                    { imageUrl: { $regex: '^/uploads/', $options: 'i' } },
                    { imageUrl: { $not: { $regex: '^/api/uploads/' } } }
                ]
            },
            [
                {
                    $set: {
                        imageUrl: {
                            $concat: ['/api', '$imageUrl']
                        }
                    }
                }
            ]
        );
        console.log(`🏛️ Updated ${clubsImageResult.modifiedCount} club profile images`);

        const clubsCoverResult = await db.collection('clubs').updateMany(
            {
                $and: [
                    { coverImageUrl: { $regex: '^/uploads/', $options: 'i' } },
                    { coverImageUrl: { $not: { $regex: '^/api/uploads/' } } }
                ]
            },
            [
                {
                    $set: {
                        coverImageUrl: {
                            $concat: ['/api', '$coverImageUrl']
                        }
                    }
                }
            ]
        );
        console.log(`🏛️ Updated ${clubsCoverResult.modifiedCount} club cover images`);

        // 4. Update Posts - imageUrl
        const postsResult = await db.collection('posts').updateMany(
            {
                $and: [
                    { imageUrl: { $regex: '^/uploads/', $options: 'i' } },
                    { imageUrl: { $not: { $regex: '^/api/uploads/' } } }
                ]
            },
            [
                {
                    $set: {
                        imageUrl: {
                            $concat: ['/api', '$imageUrl']
                        }
                    }
                }
            ]
        );
        console.log(`📝 Updated ${postsResult.modifiedCount} posts`);

        // 5. Update Applications - cvUrl
        const applicationsResult = await db.collection('applications').updateMany(
            {
                $and: [
                    { cvUrl: { $regex: '^/uploads/', $options: 'i' } },
                    { cvUrl: { $not: { $regex: '^/api/uploads/' } } }
                ]
            },
            [
                {
                    $set: {
                        cvUrl: {
                            $concat: ['/api', '$cvUrl']
                        }
                    }
                }
            ]
        );
        console.log(`📄 Updated ${applicationsResult.modifiedCount} applications`);

        // 6. Update Document Files - url and adminFileUrl
        const documentFilesResult = await db.collection('documentfiles').updateMany(
            {
                $and: [
                    { url: { $regex: '/uploads/', $options: 'i' } },
                    { url: { $not: { $regex: '/api/uploads/' } } }
                ]
            },
            [
                {
                    $set: {
                        url: {
                            $cond: {
                                if: { $regexMatch: { input: '$url', regex: '^http' } },
                                then: {
                                    $replaceOne: {
                                        input: '$url',
                                        find: '/uploads/',
                                        replacement: '/api/uploads/'
                                    }
                                },
                                else: {
                                    $concat: ['/api', '$url']
                                }
                            }
                        }
                    }
                }
            ]
        );
        console.log(`📁 Updated ${documentFilesResult.modifiedCount} document files`);

        const documentRequestsResult = await db.collection('documentrequests').updateMany(
            {
                $and: [
                    { adminFileUrl: { $regex: '/uploads/', $options: 'i' } },
                    { adminFileUrl: { $not: { $regex: '/api/uploads/' } } }
                ]
            },
            [
                {
                    $set: {
                        adminFileUrl: {
                            $cond: {
                                if: { $regexMatch: { input: '$adminFileUrl', regex: '^http' } },
                                then: {
                                    $replaceOne: {
                                        input: '$adminFileUrl',
                                        find: '/uploads/',
                                        replacement: '/api/uploads/'
                                    }
                                },
                                else: {
                                    $concat: ['/api', '$adminFileUrl']
                                }
                            }
                        }
                    }
                }
            ]
        );
        console.log(`📁 Updated ${documentRequestsResult.modifiedCount} document requests`);

        console.log('\n✅ Migration completed successfully!');
    } catch (error) {
        console.error('❌ Migration failed:', error);
        process.exit(1);
    } finally {
        await client.close();
        console.log('🔌 Disconnected from MongoDB');
    }
}

migrateImageUrls();
