import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Produit } from '../chatbot/entities/produit.entity';

@Injectable()
export class StockService {
  constructor(
    @InjectRepository(Produit)
    private produitRepo: Repository<Produit>,
  ) {}

  async getAll() {
    const produits = await this.produitRepo.find({ where: { est_actif: true } });
    return {
      success: true,
      data: produits.map((p) => ({
        id: p.id_produit,
        name: p.designation,
        type: 'product',
        price: parseFloat(p.prix_unitaire_ht?.toString() ?? '0'),
        quantity: 999,
        description: p.reference ?? '',
      })),
    };
  }

  async getById(id: string) {
    const p = await this.produitRepo.findOne({ where: { id_produit: id } });
    return { success: true, data: { id: p?.id_produit, name: p?.designation, price: p?.prix_unitaire_ht } };
  }

async create(data: any, userId: string) {
  const p = this.produitRepo.create({
    designation: data.name,
    prix_unitaire_ht: data.price,
    taux_tva: '19',
    est_actif: true,
    reference: data.description,
    id_entreprise: '30466f0a-1e77-42b6-9405-630730cef65f',
  });
  const saved = await this.produitRepo.save(p);
  return { success: true, data: { id: saved.id_produit, name: saved.designation, price: saved.prix_unitaire_ht } };
}

  async update(id: string, data: any) {
    await this.produitRepo.update(id, { designation: data.name, prix_unitaire_ht: data.price });
    return { success: true, data: { id, ...data } };
  }

  async delete(id: string) {
    await this.produitRepo.update(id, { est_actif: false });
    return { message: 'Produit supprimé' };
  }
}