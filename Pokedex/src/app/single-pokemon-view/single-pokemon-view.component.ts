import { Component, OnInit } from '@angular/core';
import { PokeapiService } from '../_services/pokeapi.service';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';

class Ability {
  name: string;
  description: string;
  constructor(name: string, description: string) {
    this.name = name;
    this.description = description;
  }
}
class Evolution extends Ability {
  num: number;
  constructor(name: string, description: string, num: number) {
    super(name, description);
    this.num = num;
  }
}

@Component({
  selector: 'app-single-pokemon-view',
  templateUrl: './single-pokemon-view.component.html',
  styleUrls: ['./single-pokemon-view.component.scss', '../../types-icons.scss'],
})
export class SinglePokemonViewComponent implements OnInit {
  currentIndex: number;
  pokemon: object;
  loading = false;
  err = false;
  photo: string;
  name: string;
  id: string;
  num: number;
  types: string[] = [];
  height: number;
  weight: number;
  stats: object[] = [];
  abilities: object[] = [];
  eggs: string[] = [];
  color: string;
  generation: string;
  evolutions: object[] = [];

  constructor(
    private pokeapiService: PokeapiService,
    private router: Router,
    private http: HttpClient
  ) {
    this.pokemonSetUp();
  }

  ngOnInit() {}

  threeDigitNumber(num: number) {
    let n = num.toString();
    n = n.padStart(3, '0');
    return n;
  }

  getAbilities(response) {
    response.forEach(ab => {
      let name: string;
      let description: string;
      name = ab['ability']['name'];
      this.http.get(ab['ability']['url']).subscribe(res => {
        description = res['effect_entries'][0]['effect'];
        const ability = new Ability(name, description);
        this.abilities.push(ability);
      });
    });
  }

  getStats(response) {
    let total = 0;
    response.forEach(stat => {
      const val = stat['base_stat'];
      total += Number(val);
      const name = stat['stat']['name'];
      const newStat = new Evolution(name, String(val), val);
      this.stats.push(newStat);
    });
    const totalStat = new Evolution('total', String(total), total / 6);
    this.stats.push(totalStat);
  }

  getEvolution(response) {
    this.http.get(response['url']).subscribe(res => {
      const name = res['chain']['species']['name'];
      const id = res['chain']['species']['url'].split('/')[6];
      const photo = this.pokeapiService.getphoto(this.threeDigitNumber(id));
      const evolution = new Evolution(name, photo, Number(id));
      this.evolutions.push(evolution);
      let x = res['chain']['evolves_to'];
      while (x.length > 0) {
        x.forEach(el => {
          const nameNext = el['species']['name'];
          const idNext = el['species']['url'].split('/')[6];
          const photoNext = this.pokeapiService.getphoto(
            this.threeDigitNumber(idNext)
          );
          const evolutionNext = new Evolution(
            nameNext,
            photoNext,
            Number(idNext)
          );
          this.evolutions.push(evolutionNext);
        });
        x = x[0]['evolves_to'];
      }
    });
  }

  loadPokemon() {
    this.pokeapiService.getPokemon(String(this.currentIndex)).subscribe(
      res => {
        this.getAbilities(res['abilities']);
        this.id = this.threeDigitNumber(res['id']);
        this.name = res['name'];
        this.num = res['id'];
        this.height = res['height'] / 10;
        this.weight = res['weight'] / 10;
        res['types'].forEach(element => {
          this.types.push(element['type']['name']);
        });
        this.getStats(res['stats']);
        this.http.get(res['species']['url']).subscribe(response => {
          this.color = response['color']['name'];
          this.generation = response['generation']['name'];
          response['egg_groups'].forEach(egg => {
            this.eggs.push(egg['name']);
          });
          this.getEvolution(response['evolution_chain']);
          this.loading = false;
        });
      },
      err => (this.err = true)
    );
  }

  pokemonSetUp() {
    this.currentIndex = Number(this.router.url.split('/')[2]);
    this.photo = this.pokeapiService.getphoto(
      this.threeDigitNumber(this.currentIndex)
    );
    this.loading = true;
    this.abilities = [];
    this.stats = [];
    this.types = [];
    this.eggs = [];
    this.evolutions = [];
    this.loadPokemon();
  }

  updateColor(progress) {
    if (progress > 90) {
      return 'danger';
    } else if (progress > 70) {
      return 'warning';
    } else if (progress > 50) {
      return 'info';
    } else if (progress > 30) {
      return 'success';
    } else {
      return 'secondary';
    }
  }

  redirect(dest) {
    this.loading = true;
    if (dest === 'next') {
      this.currentIndex += 1;
    } else {
      this.currentIndex -= 1;
    }
    setTimeout(() => {
      this.pokemonSetUp();
    }, 1000);
  }
}
