
package com.xyloan.app.data.local.entities

import androidx.room.Entity
import androidx.room.ForeignKey
import androidx.room.Index
import androidx.room.PrimaryKey
import java.util.UUID

@Entity(
    tableName = "payments",
    foreignKeys = [
        ForeignKey(
            entity = ClientEntity::class,
            parentColumns = ["id"],
            childColumns = ["clientId"],
            onDelete = ForeignKey.CASCADE
        )
    ],
    indices = [Index("clientId")]
)
data class PaymentEntity(
    @PrimaryKey val id: String = UUID.randomUUID().toString(),
    val clientId: String,
    val amount: Double,
    val type: String, // "regular" or "custom"
    val date: Long = System.currentTimeMillis(),
    val notes: String? = null
)
