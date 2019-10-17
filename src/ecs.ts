import uuid4 from 'uuid/v4';
import uuid5 from 'uuid/v5';
import * as jsonfile from 'jsonfile';
import fs from 'fs';
import util from 'util';

// Since UUIDv5 requires a namespace to generate *any* UUID, and we want namespaces to have
// consistent UUIDs, put namespaces themselves into a namespace
const componentNamespaceNamespaceUUID = "5b948c15-3c91-4f12-8339-2c25f939822c";
function namespaceUUID(n : string) : string {
	return uuid5(n, componentNamespaceNamespaceUUID);
}

let currentComponentNamespace = "global";
function componentNamespace(n : string) : void {
	currentComponentNamespace = n;
}
function clearComponentNamespace() : void {
	currentComponentNamespace = "global";
}

let components = new Map<string, Component<any>>();

class Component<T> {
	public values : Map<string, T>;
	public id : string;
	public constructor(public name : string,
		public replacer : ((v : T) => any) | undefined = undefined,
		public reviver : ((v : any) => T) | undefined = undefined,
		public componentNamespace : string = currentComponentNamespace)
	{
		this.id = uuid5(name, namespaceUUID(componentNamespace));
		this.values = new Map<string, T>();
		if (components.has(this.id)) {
			let c =  components.get(this.id)!;
			if (replacer) c.replacer = replacer;
			if (reviver) {
				// if we didn't have a reviver but do now (e.g. if the component got
				// loaded when loading the ECS data from disk), run it over all our values
				if (!(c.reviver)) {
					for (let k of c.values.keys()) {
						c.values.set(k, reviver(c.values.get(k)));
					}
				}

				c.reviver = reviver;
			}
			return c;
		}

		components.set(this.id, this);
	}
	public get(e: Entity) : T | undefined {
		return this.values.get(e.id);
	}
	public set(e : Entity, v : T) : void {
		this.values.set(e.id, v);
	}
	public delete(e : Entity) : void {
		this.values.delete(e.id);
	}
	public has(e : Entity) : boolean {
		return this.values.has(e.id);
	}
	public forEach(callback : (value : T, entity : Entity, component : Component<T>) => any, thisArg = undefined) {
		const bound = thisArg ? callback.bind(thisArg) : callback;
		this.values.forEach((value : T, id : string) => {
			bound(value, new Entity(id), this);
		});
	}
}
class Entity {
	public constructor(public id : string = uuid4()) {
	}
	public get<T>(component : Component<T>) : T | undefined {
		return component.get(this);
	}
	public set<T>(component : Component<T>, v : T) : Entity {
		component.set(this, v);
		return this;
	}
	public delete(component : Component<any>) : Entity {
		component.delete(this);
		return this;
	}
	public has(component : Component<any>) : boolean {
		return component.has(this);
	}
}

function replacer(key : string, value : any) : any {
	if (value instanceof Component) {
		let v = value as any;
		v._type = "Component";
		v.values = Array.from(value.values, ([k, v]) => [k, value.replacer ? value.replacer(v) : v]);
	}
	else if (value instanceof Entity) {
		return {
			_type: "Entity",
			id: value.id
		};
	}
	return value;
}
function reviver(key : string, value : any) : any {
	if (value._type === "Component") {
		const c = new Component<any>(value.name as string, undefined, undefined, value.componentNamespace as string);

		// if c was already declared, the constructor will return the existing component
		// if this happens and it has a reviver, use it
		let pairs = value.values;
		if (c.reviver) pairs = pairs.map(([k, v] : [string, any]) => [k, c.reviver!(v)]);

		// in case c already existed, add all loaded values to it rather than constructing
		// a new map from pairs
		for (let [id, value] of pairs) {
			c.values.set(id, value);
		}
		return c;
	}
	else if (value._type === "Entity") {
		return new Entity(value.id);
	}
	return value;
}

async function save(path : fs.PathLike) : Promise<void> {
	await jsonfile.writeFile(path, Array.from(components), { replacer: replacer });
}
async function load(path : fs.PathLike) : Promise<void> {
	if (fs.existsSync(path)) { 
		components = new Map(await jsonfile.readFile(path, { reviver: reviver }));
	}
}
function saveSync(path : fs.PathLike) : void {
	jsonfile.writeFileSync(path, Array.from(components), { replacer: replacer });
}
function loadSync(path : fs.PathLike) : void {
	if (fs.existsSync(path)) { 
		components = new Map(jsonfile.readFileSync(path, { reviver: reviver }));
	}
}

export {
	componentNamespace,
	clearComponentNamespace,
	components,
	Component,
	Entity,
	save,
	load,
	saveSync,
	loadSync
}
