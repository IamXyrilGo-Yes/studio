
package com.xyloan.app.data.local.entities

import androidx.room.Entity
import androidx.room.PrimaryKey
import java.util.UUID

@Entity(tableName = "clients")
data class ClientEntity(
    @PrimaryKey val id: String = UUID.randomUUID().toString(),
    val name: String,
    val phone: String? = null,
    val email: String? = null,
    val address: String? = null,
    val loanAmount: Double,
    val interestRate: Double,
    val initialBalance: Double,
    val dueDate: String? = null,
    val notes: String? = null,
    val createdAt: Long = System.currentTimeMillis()
)
