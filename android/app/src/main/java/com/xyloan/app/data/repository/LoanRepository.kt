
package com.xyloan.app.data.repository

import com.xyloan.app.data.local.dao.ClientDao
import com.xyloan.app.data.local.entities.ClientEntity
import com.xyloan.app.data.local.entities.PaymentEntity
import kotlinx.coroutines.flow.Flow

class LoanRepository(private val clientDao: ClientDao) {
    val allClients: Flow<List<ClientEntity>> = clientDao.getAllClients()

    suspend fun insertClient(client: ClientEntity) = clientDao.insertClient(client)
    suspend fun deleteClient(client: ClientEntity) = clientDao.deleteClient(client)
    
    fun getPaymentsForClient(clientId: String): Flow<List<PaymentEntity>> = 
        clientDao.getPaymentsForClient(clientId)

    suspend fun addPayment(payment: PaymentEntity) = clientDao.insertPayment(payment)
    suspend fun deletePayment(payment: PaymentEntity) = clientDao.deletePayment(payment)
}
