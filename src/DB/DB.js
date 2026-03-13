import mongoose from "mongoose";

const DB_Connection = async (db_uri, db_name) => {
    console.log("Connecting to MongoDB...");
    console.log(`data base name:${db_name}`);
    console.log(`data base url:${db_uri}`);

    try {
        // 🟢 FIX: Use the dbName option instead of `${db_uri}/${db_name}`
        const DB_Initialization = await mongoose.connect(db_uri, {
            dbName: db_name
        });
        console.log(`\nMongo DB has connected successfully :) DB host: ${DB_Initialization.connection.host}`);
    }
    catch(err){
        console.error("Database connection failed:", err);
        process.exit(1); 
    }
}
export default DB_Connection;