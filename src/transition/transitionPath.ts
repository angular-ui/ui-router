import Path from "../path/path"
import ResolveContext from "../resolve/resolveContext"
import Resolvable from "../resolve/resolvable"
import {IResolvables} from "../resolve/interface"
import {ParamValues} from "../params/paramValues"
import {IParamsNode, ITransNode, ITransPath, IParamsPath} from "../resolve/interface"
import {mapObj} from "../common/common"

		

class TransitionPath extends Path<ITransNode> implements ITransPath {
	resolveContext: ResolveContext;
	params: ParamValues;
	
	constructor(nodes: ITransNode[]) {
		super(nodes);
		this.resolveContext = new ResolveContext(this);
		this.params = new ParamValues(this);
	}
	
	/**
	 * Like .slice(start)
	 * 
	 * Returns a new TransitionPath representing a subpath of the current TransitionPath.  However,
	 * it shares the resolveContext and params from the current TransitionPath.  
	 * 
	 * If you have a path that contains [A, A.B, A.B.C, A.B.C.D] and tail(2) it, the resulting TransitionPath
	 * contains [A.B.C, A.B.C.D].   However when fetching ParamValues or using the ResolveContext, the orginal
	 * Path is used.
	 */
	tail(start: number): TransitionPath {
		let sliced: TransitionPath = <TransitionPath> super.slice(start);
		sliced.resolveContext = this.resolveContext;
		sliced.params = this.params;
		return sliced;
	}
		
	/**
	 * Like .slice(0, end)
	 * 
	 * Returns a new TransitionPath representing a subpath of the current TransitionPath.  A new ResolveContext
	 * and Params are computed for the new Path.
	 * 
	 * If you have a path that contains [A, A.B, A.B.C, A.B.C.D] and tail(2) it, the resulting TransitionPath
	 * contains [A.B.C, A.B.C.D].   However when fetching ParamValues or using the ResolveContext, the orginal
	 * Path is used.
	 */
	head(end: number): TransitionPath {
		return TransitionPath.fromParamsPath(super.slice(0, end));
	}
	
	static fromParamsPath(path: IParamsPath): TransitionPath {
		let transPath: ITransPath = <ITransPath> path.slice(0);
		transPath.nodes().forEach((node) => node.ownResolvables = mapObj(node.state.resolve, makeResolvable(node)));
		return TransitionPath.fromTransPath(transPath);
	}
	
	static fromTransPath(path: ITransPath): TransitionPath {
		let transPath: TransitionPath = <TransitionPath> path.slice(0);
		transPath.resolveContext = new ResolveContext(transPath);
		transPath.params = new ParamValues(transPath);
		return transPath;
	}
}