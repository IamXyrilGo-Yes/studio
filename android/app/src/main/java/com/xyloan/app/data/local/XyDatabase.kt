
package com.xyloan.app.data.local

import android.content.Context
import androidx.room.Database
import androidx.room.Room
import androidx.room.RoomDatabase
import com.xyloan.app.data.local.dao.ClientDao
import com.xyloan.app.data.local.entities.ClientEntity
import com.xyloan.app.data.local.entities.PaymentEntity

@Database(entities = [ClientEntity::class, PaymentEntity::class], version = 1, exportSchema = false)
abstract class XyDatabase : RoomDatabase() {
    abstract fun clientDao(): ClientDao

    companion object {
        @Volatile
        private var INSTANCE: XyDatabase? = null

        fun getDatabase(context: Context): XyDatabase {
            return INSTANCE ?: synchronized(this) {
                val instance = Room.databaseBuilder(
                    context.applicationContext,
                    XyDatabase::class.java,
                    "xy_loan_database"
                ).build()
                INSTANCE = instance
                instance
            }
        }
    }
}
